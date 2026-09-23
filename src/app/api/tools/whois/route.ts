import { NextRequest, NextResponse } from 'next/server';
import { isIP } from 'node:net';
import { domainToASCII } from 'node:url';
import { resolve4, resolve6, resolveMx, resolveNs, reverse } from 'node:dns/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Rdap = Record<string, unknown>;
function strings(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
function text(value: unknown) { return typeof value === 'string' ? value : ''; }
function summarize(data: Rdap) {
    const events = Array.isArray(data.events) ? data.events as Rdap[] : [];
    const entities = Array.isArray(data.entities) ? data.entities as Rdap[] : [];
    const nameservers = Array.isArray(data.nameservers) ? data.nameservers as Rdap[] : [];
    return {
        handle: text(data.handle), name: text(data.ldhName) || text(data.name), status: strings(data.status),
        country: text(data.country), startAddress: text(data.startAddress), endAddress: text(data.endAddress),
        ipVersion: text(data.ipVersion), type: text(data.type),
        events: events.slice(0, 20).map((event) => ({ action: text(event.eventAction), date: text(event.eventDate) })),
        nameservers: nameservers.slice(0, 30).map((ns) => text(ns.ldhName)).filter(Boolean),
        entities: entities.slice(0, 15).map((entity) => ({ handle: text(entity.handle), roles: strings(entity.roles), name: Array.isArray(entity.vcardArray) && Array.isArray(entity.vcardArray[1]) ? (entity.vcardArray[1] as unknown[]).map((entry) => Array.isArray(entry) && entry[0] === 'fn' ? text(entry[3]) : '').find(Boolean) || '' : '' })),
        notices: (Array.isArray(data.notices) ? data.notices as Rdap[] : []).slice(0, 8).map((n) => ({ title: text(n.title), description: strings(n.description).join(' ').slice(0, 500) })),
    };
}
async function safeDns<T>(lookup: () => Promise<T>, fallback: T): Promise<T> { try { return await lookup(); } catch { return fallback; } }
export async function GET(request: NextRequest) {
    const raw = request.nextUrl.searchParams.get('q')?.trim() ?? '';
    const ip = isIP(raw);
    const domain = !ip ? domainToASCII(raw.toLowerCase().replace(/\.$/, '')) : '';
    if (raw.length > 253 || (!ip && (!domain || !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)))) return NextResponse.json({ error: 'Enter a valid domain or IPv4/IPv6 address.' }, { status: 400 });
    try {
        const target = ip ? `ip/${encodeURIComponent(raw)}` : `domain/${domain}`;
        const response = await fetch(`https://rdap.org/${target}`, { signal: AbortSignal.timeout(8000), headers: { accept: 'application/rdap+json' }, cache: 'no-store' });
        if (!response.ok) return NextResponse.json({ error: response.status === 404 ? 'No RDAP record found.' : 'RDAP service unavailable.' }, { status: response.status === 404 ? 404 : 502 });
        const body = await response.text();
        if (body.length > 1_000_000) throw new Error('RDAP response too large');
        const rdap = summarize(JSON.parse(body) as Rdap);
        const dns = ip ? null : await Promise.all([safeDns(() => resolve4(domain), [] as string[]), safeDns(() => resolve6(domain), [] as string[]), safeDns(() => resolveMx(domain), [] as { priority: number; exchange: string }[]), safeDns(() => resolveNs(domain), [] as string[])]).then(([a, aaaa, mx, ns]) => ({ a, aaaa, mx, ns }));
        const reverseDns = ip ? await safeDns(() => reverse(raw), [] as string[]) : [];
        return NextResponse.json({ query: ip ? raw : domain, kind: ip ? 'IP network' : 'Domain', rdap, dns, reverseDns, note: ip ? 'Registry country identifies the allocation registry, not a device or person location. IP ownership and reverse DNS may change.' : 'RDAP fields depend on the registry; private registrant details may be redacted.' }, { headers: { 'Cache-Control': 'no-store' } });
    } catch { return NextResponse.json({ error: 'Lookup failed or timed out. Try again later.' }, { status: 502 }); }
}
