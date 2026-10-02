import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { addonToolEnabled } from '@/lib/addons.server';
import { hasValidOrigin, isRateLimited, noStoreHeaders } from '@/modules/web-health/route-guard';
import { diagnosticPorts, isProbeAddress, probePort } from '@/modules/whois/network';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
    const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: noStoreHeaders });
    if (!(await addonToolEnabled('whois'))) return reply({ error: 'Tools is inactive.' }, 404);
    if (!hasValidOrigin(request)) return reply({ error: 'Invalid origin.' }, 403);
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) return reply({ error: 'Port checks require an Owner or Admin account.' }, 403);
    if (isRateLimited('whois-ports', request, 3, 60000)) return reply({ error: 'Wait a minute before checking more ports.' }, 429);
    const body = await request.json().catch(() => null);
    if (!body || body.authorized !== true || typeof body.ip !== 'string' || !isProbeAddress(body.ip)) return reply({ error: 'Confirm authorization and enter one public IPv4/IPv6 address.' }, 400);
    // Literal address only: no DNS rebinding, redirects, ranges or user-selected ports.
    const results = [];
    for (let offset = 0; offset < diagnosticPorts.length; offset += 4) {
        results.push(...await Promise.all(diagnosticPorts.slice(offset, offset + 4).map(port => probePort(body.ip, port))));
    }
    return reply({ ip: body.ip, results, checkedAt: new Date().toISOString(), vantage: 'NecrotixLab hosting server; TCP connect only. Service names are conventional, not verified.' });
}
