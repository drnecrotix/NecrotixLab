import 'server-only';
import { prisma } from '@/lib/prisma';
import { bookingAddonConfig } from './server';

export async function bookingDashboardOverview(role: string | undefined, now = new Date()) {
    if (!role || !['OWNER', 'ADMIN'].includes(role)) return null;
    const config = await bookingAddonConfig();
    if (!config.installed || !config.active) return null;
    try {
        const [pending, upcoming, recent] = await prisma.$transaction([
            prisma.bookingReservation.count({ where: { status: 'PENDING' } }),
            prisma.bookingReservation.count({ where: { status: 'CONFIRMED', startTime: { gte: now } } }),
            prisma.bookingReservation.findMany({
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 5,
                select: { id: true, title: true, customerName: true, status: true, rescheduledAt: true, rescheduledFromUid: true, startTime: true },
            }),
        ]);
        return { available: true as const, pending, upcoming, recent };
    } catch {
        return { available: false as const };
    }
}
