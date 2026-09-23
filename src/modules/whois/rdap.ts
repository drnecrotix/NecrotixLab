import { isIP } from 'node:net';

type Entry = Record<string, unknown>;
type Bootstrap = { services: [string[], string[]][] };
const cache = new Map<string, { until: number; value: Bootstrap }>();
const str = (v: unknown) => typeof v === 'string' ? v : '';
const strings = (v: unknown): string[] => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
const entries = (v: unknown): Entry[] => Array.isArray(v) ? v.filter((x): x is Entry => !!x && typeof x === 'object' && !Array.isArray(x)) : [];

async function fetchJson(url: string): Promise<{ status: number; data?: Entry }> {
    const response = await fetch(url, { signal: AbortSignal.timeout(6500), headers: { accept: 'application/rdap+json, application/json' }, cache: 'no-store' });
    if (response.status === 404) return { status: 404 };
    if (!response.ok) throw new Error(`RDAP HTTP ${response.status}`);
    const body = await response.text();
    if (body.length > 1_000_000) throw new Error('RDAP response too large');
    return { status: response.status, data: JSON.parse(body) as Entry };
}
async function bootstrap(kind: string): Promise<Bootstrap> {
    const previous = cache.get(kind);
    if (previous && previous.until > Date.now()) return previous.value;
    const result = (await fetchJson(`https://data.iana.org/rdap/${kind}.json`)).data as Bootstrap;
    if (!result || !Array.isArray(result.services)) throw new Error('Invalid IANA registry');
    cache.set(kind, { until: Date.now() + 86_400_000, value: result });
    return result;
}
function bytes(ip: string): number[] | null {
    if (isIP(ip) === 4) return ip.split('.').map(Number);
    if (isIP(ip) !== 6) return null;
    let address = ip.toLowerCase();
    if (address.includes('.')) {
        const colon = address.lastIndexOf(':');
        const part = bytes(address.slice(colon + 1));
        if (!part) return null;
        address = `${address.slice(0, colon)}:${(part[0] * 256 + part[1]).toString(16)}:${(part[2] * 256 + part[3]).toString(16)}`;
    }
    const halves = address.split('::'), left = halves[0] ? halves[0].split(':') : [], right = halves[1] ? halves[1].split(':') : [];
    const words = halves.length === 2 ? [...left, ...Array(8 - left.length - right.length).fill('0'), ...right] : left;
    return words.length === 8 ? words.flatMap((word) => { const n = parseInt(word, 16); return [n >> 8, n & 255]; }) : null;
}
function cidrScore(ip: string, cidr: string) {
    const [prefix, length] = cidr.split('/'), source = bytes(ip), target = bytes(prefix), bits = Number(length);
    if (!source || !target || source.length !== target.length || !Number.isInteger(bits) || bits < 0 || bits > source.length * 8) return -1;
    for (let i = 0; i < Math.floor(bits / 8); i++) if (source[i] !== target[i]) return -1;
    const rest = bits % 8, index = Math.floor(bits / 8);
    return rest && (source[index] >> (8 - rest)) !== (target[index] >> (8 - rest)) ? -1 : bits;
}
export function registryUrls(data: Bootstrap, query: string, ip: boolean): string[] {
    let best = -1, urls: string[] = [];
    for (const [keys, bases] of data.services) for (const key of keys) {
        const score = ip ? cidrScore(query, key) : query === key.toLowerCase() || query.endsWith(`.${key.toLowerCase()}`) ? key.length : -1;
        if (score > best) { best = score; urls = bases; }
    }
    return urls.filter((url) => { try { return new URL(url).protocol === 'https:'; } catch { return false; } });
}
export async function lookupRdap(query: string, ip: boolean) {
    let candidates: string[] = [];
    try { candidates = registryUrls(await bootstrap(ip ? isIP(query) === 4 ? 'ipv4' : 'ipv6' : 'dns'), query, ip); } catch { /* secondary resolver */ }
    const path = `${ip ? 'ip' : 'domain'}/${encodeURIComponent(query)}`;
    let notFound = false;
    for (const base of [...candidates.slice(0, 3), 'https://rdap.org/']) {
        try {
            const url = `${base.replace(/\/?$/, '/')}${path}`;
            const result = await fetchJson(url);
            if (result.status === 404) { notFound = true; continue; }
            if (result.data) return { data: result.data, source: url };
        } catch { /* try another registry */ }
    }
    throw new Error(notFound ? 'No RDAP record found.' : 'RDAP services are currently unreachable.');
}
function card(entity: Entry, key: string) {
    const vc = entity.vcardArray;
    if (!Array.isArray(vc) || !Array.isArray(vc[1])) return '';
    const field = vc[1].find((item: unknown) => Array.isArray(item) && item[0] === key);
    return Array.isArray(field) ? str(field[3]) : '';
}
export function summarizeRdap(data: Entry) {
    return {
        handle: str(data.handle), name: str(data.ldhName) || str(data.name), status: strings(data.status),
        country: str(data.country), startAddress: str(data.startAddress), endAddress: str(data.endAddress),
        ipVersion: str(data.ipVersion), type: str(data.type), port43: str(data.port43), parentHandle: str(data.parentHandle),
        network: entries(data.cidr0_cidrs).map((item) => `${str(item.v4prefix || item.v6prefix)}/${item.length}`).slice(0, 20),
        events: entries(data.events).slice(0, 30).map((item) => ({ action: str(item.eventAction), date: str(item.eventDate) })),
        nameservers: entries(data.nameservers).slice(0, 50).map((item) => str(item.ldhName)).filter(Boolean),
        entities: entries(data.entities).slice(0, 25).map((item) => ({ handle: str(item.handle), roles: strings(item.roles), name: card(item, 'fn'), organization: card(item, 'org'), email: card(item, 'email'), phone: card(item, 'tel') })),
        notices: entries(data.notices).slice(0, 12).map((item) => ({ title: str(item.title), description: strings(item.description).join(' ').slice(0, 800) })),
        secureDns: data.secureDNS && typeof data.secureDNS === 'object' ? Boolean((data.secureDNS as Entry).delegationSigned) : null,
        links: entries(data.links).filter((item) => str(item.href).startsWith('https://')).slice(0, 12).map((item) => ({ rel: str(item.rel), href: str(item.href) })),
    };
}
