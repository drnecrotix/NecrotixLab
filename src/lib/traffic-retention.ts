import { prisma } from '@/lib/prisma';
import { trafficRetentionCutoffs } from '@/lib/traffic-analytics';

const CLEANUP_STATE_ID = 'traffic-retention';

async function claimTrafficCleanup(now: Date, claimBefore: Date) {
    const updated = await prisma.trafficCleanupState.updateMany({
        where: { id: CLEANUP_STATE_ID, lastRunAt: { lt: claimBefore } },
        data: { lastRunAt: now },
    });
    if (updated.count > 0) return true;

    const existing = await prisma.trafficCleanupState.findUnique({
        where: { id: CLEANUP_STATE_ID },
        select: { id: true },
    });
    if (existing) return false;

    try {
        await prisma.trafficCleanupState.create({ data: { id: CLEANUP_STATE_ID, lastRunAt: now } });
        return true;
    } catch {
        return false;
    }
}

export async function cleanupTrafficAnalyticsIfDue(now = new Date()) {
    const cutoffs = trafficRetentionCutoffs(now);
    const claimed = await claimTrafficCleanup(now, cutoffs.cleanupClaim);
    if (!claimed) return false;

    await prisma.$transaction([
        prisma.trafficSession.deleteMany({ where: { lastSeenAt: { lt: cutoffs.session } } }),
        prisma.trafficMetric.deleteMany({ where: { bucketStart: { lt: cutoffs.metric } } }),
        prisma.trafficPageEvent.deleteMany({ where: { occurredAt: { lt: cutoffs.pageEvent } } }),
        prisma.trafficPageEvent.updateMany({
            where: {
                occurredAt: { lt: cutoffs.ipContext },
                OR: [
                    { ipAddress: { not: null } },
                    { ipAsn: { not: null } },
                    { ipIsp: { not: null } },
                    { ipOrganization: { not: null } },
                    { ipDomain: { not: null } },
                ],
            },
            data: {
                ipAddress: null,
                ipAsn: null,
                ipIsp: null,
                ipOrganization: null,
                ipDomain: null,
            },
        }),
    ]);
    return true;
}
