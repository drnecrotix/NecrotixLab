export type TrafficRange = '24h' | '7d' | '30d';
export type TrafficDevice = 'desktop' | 'mobile' | 'tablet' | 'unknown';
export type TrafficOperatingSystem = 'Windows' | 'macOS' | 'iOS/iPadOS' | 'Android' | 'ChromeOS' | 'Linux' | 'Unknown';

export const TRAFFIC_SESSION_COOKIE = 'necrotix_traffic_session';
export const TRAFFIC_SESSION_RETENTION_HOURS = 24;
export const TRAFFIC_IP_RETENTION_HOURS = 24;
export const TRAFFIC_METRIC_RETENTION_DAYS = 30;
export const TRAFFIC_PAGE_EVENT_RETENTION_DAYS = 30;
export const TRAFFIC_CLEANUP_INTERVAL_HOURS = 6;
export const TRAFFIC_PAGE_EVENT_ADMIN_LIMIT = 150;
export const TRAFFIC_VISIT_TIMEOUT_MINUTES = 30;
export const LIVE_VISITOR_WINDOW_MINUTES = 5;
export const COUNTRY_LOOKUP_RETRY_HOURS = 6;

const PAGE_EVENT_DEVICE_SEPARATOR = '::';

export function trafficRetentionCutoffs(now: Date) {
    return {
        session: new Date(now.getTime() - TRAFFIC_SESSION_RETENTION_HOURS * 60 * 60 * 1000),
        metric: new Date(now.getTime() - TRAFFIC_METRIC_RETENTION_DAYS * 24 * 60 * 60 * 1000),
        pageEvent: new Date(now.getTime() - TRAFFIC_PAGE_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000),
        ipContext: new Date(now.getTime() - TRAFFIC_IP_RETENTION_HOURS * 60 * 60 * 1000),
        cleanupClaim: new Date(now.getTime() - TRAFFIC_CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000),
    };
}

export function latestLiveEventIds(
    events: Array<{ id: string; sessionHash: string; path: string }>,
    currentPathBySession: Map<string, string>,
) {
    const result = new Map<string, string>();
    const seen = new Set<string>();
    for (const event of events) {
        if (seen.has(event.sessionHash)) continue;
        seen.add(event.sessionHash);
        if (currentPathBySession.get(event.sessionHash) === event.path) {
            result.set(event.sessionHash, event.id);
        }
    }
    return result;
}

export function prioritizeLatestLiveVisitors<Visitor extends {
    id: string;
    visitorId: string;
    ipAddress: string | null;
    isLiveCurrent: boolean;
    occurredAt: string;
}>(visitors: Visitor[]) {
    const claimedLiveIdentities = new Set<string>();
    const normalized = [...visitors]
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.id.localeCompare(a.id))
        .map((visitor) => {
            if (!visitor.isLiveCurrent) return visitor;

            const identity = visitor.ipAddress
                ? `ip:${visitor.ipAddress.trim().toLocaleLowerCase('en')}`
                : `visitor:${visitor.visitorId}`;
            if (claimedLiveIdentities.has(identity)) {
                return { ...visitor, isLiveCurrent: false };
            }
            claimedLiveIdentities.add(identity);
            return visitor;
        });

    return normalized.sort((a, b) => {
        if (a.isLiveCurrent !== b.isLiveCurrent) return a.isLiveCurrent ? -1 : 1;
        return b.occurredAt.localeCompare(a.occurredAt) || b.id.localeCompare(a.id);
    });
}

export function parseTrafficRange(value: string | null | undefined): TrafficRange {
    return value === '7d' || value === '30d' ? value : '24h';
}

export function trafficRangeHours(range: TrafficRange) {
    if (range === '7d') return 24 * 7;
    if (range === '30d') return 24 * 30;
    return 24;
}

export function startOfUtcHour(value: Date) {
    return new Date(Date.UTC(
        value.getUTCFullYear(),
        value.getUTCMonth(),
        value.getUTCDate(),
        value.getUTCHours(),
        0,
        0,
        0,
    ));
}

export function startOfUtcDay(value: Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 0, 0, 0, 0));
}

export function countryCodeFromHeaders(headers: Headers) {
    const direct = [
        headers.get('cf-ipcountry'),
        headers.get('x-vercel-ip-country'),
        headers.get('cloudfront-viewer-country'),
        headers.get('x-country-code'),
        headers.get('x-country'),
        headers.get('x-geo-country'),
        headers.get('x-geoip-country'),
        headers.get('x-geoip-country-code'),
        headers.get('x-forwarded-country'),
        headers.get('x-client-country'),
        headers.get('geoip-country-code'),
        headers.get('fastly-client-country'),
        headers.get('fly-client-country'),
        headers.get('x-appengine-country'),
    ].find((value) => value?.trim())?.trim().toUpperCase();

    if (direct && /^[A-Z]{2}$/.test(direct)) return direct;

    const edgeScape = headers.get('x-akamai-edgescape');
    const edgeCountry = edgeScape?.match(/(?:^|,)\s*country_code=([A-Za-z]{2})(?:,|$)/i)?.[1]?.toUpperCase();
    return edgeCountry && /^[A-Z]{2}$/.test(edgeCountry) ? edgeCountry : 'XX';
}

function decodeLocationHeader(value: string | null | undefined) {
    if (!value?.trim()) return null;
    const raw = value.trim().replace(/^"|"$/g, '');
    let decoded = raw;
    try {
        decoded = decodeURIComponent(raw.replace(/\+/g, '%20'));
    } catch {
        decoded = raw;
    }
    const sanitized = decoded.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 80);
    return sanitized || null;
}

export function cityFromHeaders(headers: Headers) {
    const direct = [
        headers.get('x-vercel-ip-city'),
        headers.get('cloudfront-viewer-city'),
        headers.get('x-city'),
        headers.get('x-geo-city'),
        headers.get('x-geoip-city'),
        headers.get('x-forwarded-city'),
        headers.get('x-client-city'),
        headers.get('geoip-city'),
    ].find((value) => value?.trim());

    const directCity = decodeLocationHeader(direct);
    if (directCity) return directCity;

    const edgeScape = headers.get('x-akamai-edgescape');
    const edgeCity = edgeScape?.match(/(?:^|,)\s*city=([^,]+)(?:,|$)/i)?.[1];
    return decodeLocationHeader(edgeCity);
}

function normalizeIpCandidate(value: string | null | undefined) {
    if (!value) return null;
    let candidate = value.trim().replace(/^for=/i, '').replace(/^"|"$/g, '');
    if (candidate.startsWith('[')) {
        const closing = candidate.indexOf(']');
        if (closing > 0) candidate = candidate.slice(1, closing);
    } else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(candidate)) {
        candidate = candidate.slice(0, candidate.lastIndexOf(':'));
    }
    if (candidate.toLowerCase().startsWith('::ffff:')) candidate = candidate.slice(7);
    return candidate || null;
}

export function clientIpFromHeaders(headers: Headers) {
    const direct = [
        headers.get('cf-connecting-ip'),
        headers.get('true-client-ip'),
        headers.get('x-real-ip'),
        headers.get('x-client-ip'),
    ];

    for (const value of direct) {
        const candidate = normalizeIpCandidate(value);
        if (candidate) return candidate;
    }

    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {
        for (const value of forwarded.split(',')) {
            const candidate = normalizeIpCandidate(value);
            if (candidate) return candidate;
        }
    }

    return null;
}

export type IpContext = {
    countryCode: string;
    city: string | null;
    asn: string | null;
    isp: string | null;
    organization: string | null;
    domain: string | null;
};

function sanitizeNetworkLabel(value: string | null | undefined, maxLength = 120) {
    if (!value?.trim()) return null;
    const sanitized = value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength);
    return sanitized || null;
}

export function normalizeAsn(value: string | number | null | undefined) {
    if (value === null || value === undefined) return null;
    const digits = String(value).trim().replace(/^AS/i, '');
    return /^\d{1,10}$/.test(digits) ? `AS${digits}` : null;
}

const EMPTY_IP_CONTEXT: IpContext = {
    countryCode: 'XX',
    city: null,
    asn: null,
    isp: null,
    organization: null,
    domain: null,
};

export async function ipContextFromIp(ipAddress: string): Promise<IpContext> {
    try {
        const response = await fetch(`https://ipwho.is/${encodeURIComponent(ipAddress)}`, {
            cache: 'no-store',
            headers: {
                Accept: 'application/json',
                'User-Agent': 'NecrotixLab-Traffic-Location-Lookup',
            },
            signal: AbortSignal.timeout(1800),
        });
        if (!response.ok) return EMPTY_IP_CONTEXT;

        const payload = await response.json() as {
            success?: boolean;
            country_code?: string;
            city?: string;
            connection?: {
                asn?: string | number;
                isp?: string;
                org?: string;
                domain?: string;
            };
        };
        if (payload.success === false) return EMPTY_IP_CONTEXT;

        const country = payload.country_code?.trim().toUpperCase();
        return {
            countryCode: country && /^[A-Z]{2}$/.test(country) ? country : 'XX',
            city: decodeLocationHeader(payload.city),
            asn: normalizeAsn(payload.connection?.asn),
            isp: sanitizeNetworkLabel(payload.connection?.isp),
            organization: sanitizeNetworkLabel(payload.connection?.org),
            domain: sanitizeNetworkLabel(payload.connection?.domain, 100),
        };
    } catch {
        return EMPTY_IP_CONTEXT;
    }
}

export async function ipLocationFromIp(ipAddress: string) {
    return ipContextFromIp(ipAddress);
}

export async function countryCodeFromIp(ipAddress: string) {
    const location = await ipContextFromIp(ipAddress);
    return location.countryCode;
}

export function deviceFromUserAgent(userAgent: string | null | undefined): TrafficDevice {
    const ua = userAgent || '';
    if (/iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
    if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return 'mobile';
    if (!ua) return 'unknown';
    return 'desktop';
}

export function operatingSystemFromUserAgent(userAgent: string | null | undefined): TrafficOperatingSystem {
    const ua = userAgent || '';
    if (!ua) return 'Unknown';
    if (/Windows Phone|Windows NT/i.test(ua)) return 'Windows';
    if (/CrOS/i.test(ua)) return 'ChromeOS';
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod|Macintosh.*Mobile/i.test(ua)) return 'iOS/iPadOS';
    if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS';
    if (/Linux|X11/i.test(ua)) return 'Linux';
    return 'Unknown';
}

export function encodePageEventDeviceContext(device: TrafficDevice, operatingSystem: TrafficOperatingSystem) {
    return `${device}${PAGE_EVENT_DEVICE_SEPARATOR}${operatingSystem}`;
}

export function decodePageEventDeviceContext(value: string | null | undefined): {
    device: TrafficDevice;
    operatingSystem: TrafficOperatingSystem;
} {
    const [rawDevice = 'unknown', rawOperatingSystem] = (value || '').split(PAGE_EVENT_DEVICE_SEPARATOR, 2);
    const device: TrafficDevice = ['desktop', 'mobile', 'tablet', 'unknown'].includes(rawDevice)
        ? rawDevice as TrafficDevice
        : 'unknown';
    const knownOperatingSystems: TrafficOperatingSystem[] = ['Windows', 'macOS', 'iOS/iPadOS', 'Android', 'ChromeOS', 'Linux', 'Unknown'];
    const operatingSystem = knownOperatingSystems.includes(rawOperatingSystem as TrafficOperatingSystem)
        ? rawOperatingSystem as TrafficOperatingSystem
        : 'Unknown';

    return { device, operatingSystem };
}

export function isLikelyBot(userAgent: string | null | undefined) {
    return /bot|crawler|spider|crawling|preview|facebookexternalhit|slurp|bingpreview|headless/i.test(userAgent || '');
}

export function countryName(code: string) {
    if (!code || code === 'XX') return 'Unknown';
    try {
        return new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) || code.toUpperCase();
    } catch {
        return code.toUpperCase();
    }
}
