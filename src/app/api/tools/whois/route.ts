import { NextRequest, NextResponse } from 'next/server';
import { isIP } from 'node:net';
import { domainToASCII } from 'node:url';
import { resolve4, resolve6, resolveMx, resolveNs, resolveTxt, resolveCaa, reverse } from 'node:dns/promises';
import { addonToolEnabled } from '@/lib/addons.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { isRateLimited } from '@/modules/web-health/route-guard';
import { locateIp } from '@/modules/whois/geolocation';
import { lookupRdap, summarizeRdap } from '@/modules/whois/rdap';
async function safeDns<T>(lookup: () => Promise<T>, fallback: T): Promise<T> { try { return await lookup(); } catch { return fallback; } }
export async function GET(request: NextRequest) {
    if (!(await addonToolEnabled('whois'))) return NextResponse.json({ error: 'Tools is inactive.' }, { status: 404 });
    if (isRateLimited('whois', request, 20, 60000)) return NextResponse.json({ error: 'Too many lookups. Try again in a minute.' }, { status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } });
    const raw = request.nextUrl.searchParams.get('q')?.trim() ?? '';
    const ip = isIP(raw);
    const domain = !ip ? domainToASCII(raw.toLowerCase().replace(/\.$/, '')) : '';
    if (raw.length > 253 || (!ip && (!domain || !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)))) return NextResponse.json({ error: 'Enter a valid domain or IPv4/IPv6 address.' }, { status: 400 });
    try {
        const { data, source } = await lookupRdap(ip ? raw : domain, Boolean(ip));
        const rdap = summarizeRdap(data);
        const dns = ip ? null : await Promise.all([safeDns(() => resolve4(domain), [] as string[]), safeDns(() => resolve6(domain), [] as string[]), safeDns(() => resolveMx(domain), [] as { priority: number; exchange: string }[]), safeDns(() => resolveNs(domain), [] as string[]), safeDns(() => resolveTxt(domain), [] as string[][]), safeDns(() => resolveCaa(domain), [] as Awaited<ReturnType<typeof resolveCaa>>)]).then(([a, aaaa, mx, ns, txt, caa]) => ({ a, aaaa, mx, ns, txt, caa }));
        const reverseDns = ip ? await safeDns(() => reverse(raw), [] as string[]) : [];
        const locationIp = ip ? raw : dns?.a[0] || dns?.aaaa[0];
        const geolocation = locationIp ? await locateIp(locationIp) : null;
        return NextResponse.json({ geolocation, locationNote: 'IP geolocation is an estimate of network infrastructure, not a person or device address. For domains, the first resolved address is shown; CDN and anycast locations may differ.', query: ip ? raw : domain, source, kind: ip ? 'IP network' : 'Domain', rdap, dns, reverseDns, note: ip ? 'Registry country identifies the allocation registry, not a device or person location. IP ownership and reverse DNS may change.' : 'RDAP fields depend on the registry; private registrant details may be redacted.' }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) { const message = error instanceof Error ? error.message : 'Lookup failed.'; return NextResponse.json({ error: message }, { status: message === 'No RDAP record found.' ? 404 : 502 }); }
}
