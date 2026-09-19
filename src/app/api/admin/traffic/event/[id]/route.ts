import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
    LIVE_VISITOR_WINDOW_MINUTES,
    TRAFFIC_IP_RETENTION_HOURS,
    countryName,
    decodePageEventDeviceContext,
} from '@/lib/traffic-analytics';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const event = await prisma.trafficPageEvent.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: 'Activity event not found.' }, { status: 404 });

    const now = new Date();
    const ipCutoff = new Date(now.getTime() - TRAFFIC_IP_RETENTION_HOURS * 60 * 60 * 1000);
    const liveCutoff = new Date(now.getTime() - LIVE_VISITOR_WINDOW_MINUTES * 60 * 1000);
    const [history, totalEvents, firstEvent, liveSession] = await Promise.all([
        prisma.trafficPageEvent.findMany({
            where: { sessionHash: event.sessionHash },
            orderBy: { occurredAt: 'desc' },
            take: 25,
            select: { id: true, path: true, countryCode: true, city: true, deviceType: true, occurredAt: true },
        }),
        prisma.trafficPageEvent.count({ where: { sessionHash: event.sessionHash } }),
        prisma.trafficPageEvent.findFirst({
            where: { sessionHash: event.sessionHash },
            orderBy: { occurredAt: 'asc' },
            select: { occurredAt: true },
        }),
        prisma.trafficSession.findFirst({
            where: { sessionHash: event.sessionHash, lastSeenAt: { gte: liveCutoff } },
            select: { currentPath: true, lastSeenAt: true },
        }),
    ]);

    const includeIp = event.occurredAt >= ipCutoff;
    const { device, operatingSystem } = decodePageEventDeviceContext(event.deviceType);
    const latestEventId = history[0]?.id;

    return NextResponse.json({
        event: {
            id: event.id,
            occurredAt: event.occurredAt.toISOString(),
            path: event.path,
            countryCode: event.countryCode,
            countryName: countryName(event.countryCode),
            city: event.city,
            device,
            operatingSystem,
            ipAddress: includeIp ? event.ipAddress : null,
            ipVersion: includeIp && event.ipAddress ? (event.ipAddress.includes(':') ? 'IPv6' : 'IPv4') : null,
            network: includeIp ? {
                asn: event.ipAsn,
                isp: event.ipIsp,
                organization: event.ipOrganization,
                domain: event.ipDomain,
            } : null,
        },
        visitor: {
            id: event.sessionHash.slice(0, 12),
            firstSeenAt: firstEvent?.occurredAt.toISOString() || event.occurredAt.toISOString(),
            totalEvents,
            isLiveCurrent: Boolean(liveSession && latestEventId === event.id && liveSession.currentPath === event.path),
            lastSeenAt: liveSession?.lastSeenAt.toISOString() || history[0]?.occurredAt.toISOString() || event.occurredAt.toISOString(),
        },
        history: history.map((item) => {
            const context = decodePageEventDeviceContext(item.deviceType);
            return {
                id: item.id,
                path: item.path,
                countryName: countryName(item.countryCode),
                city: item.city,
                device: context.device,
                operatingSystem: context.operatingSystem,
                occurredAt: item.occurredAt.toISOString(),
                isCurrent: Boolean(liveSession && latestEventId === item.id && liveSession.currentPath === item.path),
            };
        }),
    }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}
