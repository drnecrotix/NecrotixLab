import { isIP } from 'node:net';
import { validatePublicTarget } from '@/modules/web-health/http';
export type GeoLocation = { ip: string; country: string; region: string; city: string; postal: string; latitude: number | null; longitude: number | null; timezone: string; asn: string; isp: string; organization: string; networkDomain: string };
export async function locateIp(ip: string): Promise<GeoLocation | null> {
    if (!isIP(ip)) return null;
    try {
        validatePublicTarget(new URL(`https://${isIP(ip) === 6 ? `[${ip}]` : ip}`));
        const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(4000), cache: 'no-store' });
        if (!response.ok) return null;
        const data = await response.json();
        if (data.success !== true) return null;
        const str = (v: unknown) => typeof v === 'string' ? v.slice(0, 200) : '';
        const coordinate = (v: unknown, limit: number) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= limit ? v : null;
        return { ip, country: str(data.country), region: str(data.region), city: str(data.city), postal: str(data.postal), latitude: coordinate(data.latitude, 90), longitude: coordinate(data.longitude, 180), timezone: str(data.timezone?.id), asn: typeof data.connection?.asn === 'number' ? `AS${data.connection.asn}` : '', isp: str(data.connection?.isp), organization: str(data.connection?.org), networkDomain: str(data.connection?.domain) };
    } catch { return null; }
}
