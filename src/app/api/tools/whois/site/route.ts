import { NextRequest, NextResponse } from 'next/server';
import { domainToASCII } from 'node:url';
import { addonToolEnabled } from '@/lib/addons.server';
import { hasValidOrigin, isRateLimited, noStoreHeaders } from '@/modules/web-health/route-guard';
import { requestPublicPage } from '@/modules/web-health/http';
import { isProbeAddress } from '@/modules/whois/network';
import { adminPaths, classifyAdmin, detectCms } from '@/modules/whois/cms';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
    const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: noStoreHeaders });
    if (!(await addonToolEnabled('whois'))) return reply({ error: 'Tools is inactive.' }, 404);
    if (!hasValidOrigin(request)) return reply({ error: 'Invalid origin.' }, 403);
    if (isRateLimited('whois-site', request, 3, 60000)) return reply({ error: 'Wait a minute before checking more websites.' }, 429);
    const body = await request.json().catch(() => null);
    const domain = typeof body?.domain === 'string' && body.domain.length <= 253 ? domainToASCII(body.domain.trim().toLowerCase().replace(/\.$/, '')) : '';
    if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) return reply({ error: 'Enter a valid domain name, without a URL path.' }, 400);
    if (body.admin === true && body.authorized !== true) return reply({ error: 'Confirm permission before checking login paths.' }, 400);
    const options = { maxBodyBytes: 196608, timeoutMs: 3000, maxRedirects: 2, addressFilter: isProbeAddress, signal: AbortSignal.timeout(10000) };
    try {
        const page = await requestPublicPage(new URL(`https://${domain}/`), options);
        const cms = detectCms(page.body, page.headers);
        const panels = body.admin === true ? await Promise.all(adminPaths(cms).map(async path => {
            const target = new URL(path, page.finalUrl.origin);
            try {
                const result = await requestPublicPage(target, { ...options, allowedOrigin: target.origin });
                return { path, url: result.finalUrl.href, status: result.statusCode, finding: classifyAdmin(result.statusCode, result.body, result.finalUrl.pathname, page.body) };
            } catch { return { path, url: target.href, status: null, finding: 'Could not verify: timeout, blocked redirect or network error' }; }
        })) : [];
        const header = (key: string) => { const value = page.headers[key]; return Array.isArray(value) ? value.join(', ') : value || 'Not disclosed'; };
        return reply({ domain, finalUrl: page.finalUrl.href, status: page.statusCode, server: header('server'), poweredBy: header('x-powered-by'), contentType: header('content-type'), cms, panels, checkedAt: new Date().toISOString(), truncated: page.truncated, note: 'Public HTML and headers only. Signatures can be hidden, cached or spoofed. A login page does not prove administrator access or a vulnerability. HTTPS only; custom or hidden login paths are not enumerated.' });
    } catch { return reply({ error: 'Could not inspect this HTTPS website. It may be unavailable, blocked, or redirecting to a non-public address.' }, 422); }
}
