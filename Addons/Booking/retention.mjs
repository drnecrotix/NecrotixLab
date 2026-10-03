export const BOOKING_RETENTION_DAYS = 30;
/** @param {Date} now */
export function bookingRetentionCutoff(now = new Date()) { return new Date(+now - BOOKING_RETENTION_DAYS * 86400000); }

/** @param {Date} now
 * @returns {import('@prisma/client').Prisma.BookingReservationWhereInput}
 */
export function expiredBookingFilter(now = new Date()) {
    const cutoff = bookingRetentionCutoff(now);
    return { OR: [
        { status: { in: ['CANCELLED', 'REJECTED', 'RESCHEDULED'] }, eventAt: { lte: cutoff } },
        { status: { notIn: ['CANCELLED', 'REJECTED', 'RESCHEDULED'] }, endTime: { lte: cutoff } },
    ] };
}

/** @param {Date} eventAt @param {Date} now */
export function withinBookingRetention(eventAt, now = new Date()) { return +eventAt > +bookingRetentionCutoff(now); }
