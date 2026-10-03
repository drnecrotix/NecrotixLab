import 'server-only';
import { prisma } from '@/lib/prisma';
import { expiredBookingFilter } from './retention.mjs';
export async function purgeExpiredBookings(now = new Date()) {
    // Cascade removes personal notification/reminder data. Projects are detached.
    await prisma.bookingRateLimit.deleteMany({ where: { expiresAt: { lt: now } } });
    const result = await prisma.bookingReservation.deleteMany({ where: expiredBookingFilter(now) });
    return result.count;
}
