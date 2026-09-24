import { NextRequest, NextResponse } from 'next/server';
import { clientIp } from '@/modules/whois/client-ip';
import { toolsPackageActive } from '@/lib/addons.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    if (!(await toolsPackageActive())) return NextResponse.json({ error: 'Tools is inactive.' }, { status: 404 });
    const ip = clientIp(request.headers);
    return ip ? NextResponse.json({ ip }, { headers: { 'Cache-Control': 'no-store' } }) : NextResponse.json({ error: 'The server could not determine your public IP address.' }, { status: 422 });
}
