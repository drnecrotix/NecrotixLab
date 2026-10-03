/** @param {{ status: string, rescheduledAt?: Date | null, rescheduledFromUid?: string | null }} booking */
export function bookingStatusCode(booking) {
    if (booking.status === 'CONFIRMED' && (booking.rescheduledAt || booking.rescheduledFromUid)) return 'RESCHEDULED';
    if (['CANCELLED', 'REJECTED'].includes(booking.status)) return 'DECLINED';
    return booking.status;
}

/** @param {{ status: string, rescheduledAt?: Date | null, rescheduledFromUid?: string | null }} booking */
export function bookingStatusLabel(booking) {
    const labels = { CONFIRMED: 'Одобрен / Approved', PENDING: 'В изчакване / Pending', RESCHEDULED: 'Пренасочен / Rescheduled', DECLINED: 'Отказан / Declined', COMPLETED: 'Завършен / Completed' };
    return labels[bookingStatusCode(booking)] || 'Неизвестен / Unknown';
}

/** @param {string | undefined} status
 * @returns {import('@prisma/client').Prisma.BookingReservationWhereInput}
 */
export function bookingStatusFilter(status) {
    if (status === 'ACTIVE') return { status: 'CONFIRMED' };
    if (status === 'RESCHEDULED') return { OR: [{ status: 'RESCHEDULED' }, { status: 'CONFIRMED', OR: [{ rescheduledAt: { not: null } }, { rescheduledFromUid: { not: null } }] }] };
    if (status === 'DECLINED' || status === 'CANCELLED' || status === 'REJECTED') return { status: { in: ['CANCELLED', 'REJECTED'] } };
    if (status === 'CONFIRMED') return { status: 'CONFIRMED', rescheduledAt: null, rescheduledFromUid: null };
    if (status === 'PENDING' || status === 'COMPLETED') return { status };
    return {};
}

/** @param {{ trigger: string, data: { eventAt: Date, startTime: Date, endTime: Date } }} event
 * @param {{ startTime: Date, endTime: Date, rescheduledAt?: Date | null } | null} existing
 * @param {{ rescheduledAt?: Date | null } | null} previous
 */
export function bookingRescheduledAt(event, existing, previous) {
    if (event.trigger === 'BOOKING_RESCHEDULED' || (existing && (+existing.startTime !== +event.data.startTime || +existing.endTime !== +event.data.endTime))) return event.data.eventAt;
    return existing?.rescheduledAt || previous?.rescheduledAt || null;
}
