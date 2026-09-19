import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { csvDocument } from '@/lib/csv';
import {
    TRAFFIC_IP_RETENTION_HOURS,
    countryName,
    decodePageEventDeviceContext,
    parseTrafficRange,
    trafficRangeHours,
} from '@/lib/traffic-analytics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const range = parseTrafficRange(request.nextUrl.searchParams.get('range'));
    const now = new Date();
    const cutoff = new Date(now.getTime() - trafficRangeHours(range) * 60 * 60 * 1000);
    const ipCutoff = new Date(now.getTime() - TRAFFIC_IP_RETENTION_HOURS * 60 * 60 * 1000);
    const events = await prisma.trafficPageEvent.findMany({
        where: { occurredAt: { gte: cutoff } },
        orderBy: { occurredAt: 'desc' },
        take: 50_000,
    });

    const rows: unknown[][] = [[
        'occurred_at_utc',
        'anonymous_visitor',
        'path',
        'country_code',
        'country',
        'city',
        'device',
        'operating_system',
        'ip_address',
        'ip_version',
        'asn',
        'isp',
        'organisation',
        'network_domain',
    ]];

    for (const event of events) {
        const { device, operatingSystem } = decodePageEventDeviceContext(event.deviceType);
        const includeIp = event.occurredAt >= ipCutoff;
        rows.push([
            event.occurredAt.toISOString(),
            event.sessionHash.slice(0, 12),
            event.path,
            event.countryCode,
            countryName(event.countryCode),
            event.city,
            device,
            operatingSystem,
            includeIp ? event.ipAddress : null,
            includeIp && event.ipAddress ? (event.ipAddress.includes(':') ? 'IPv6' : 'IPv4') : null,
            includeIp ? event.ipAsn : null,
            includeIp ? event.ipIsp : null,
            includeIp ? event.ipOrganization : null,
            includeIp ? event.ipDomain : null,
        ]);
    }

    const filename = `necrotixlab-visitor-activity-${range}-${now.toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csvDocument(rows), {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'private, no-store, max-age=0',
            'X-Content-Type-Options': 'nosniff',
        },
    });
}
