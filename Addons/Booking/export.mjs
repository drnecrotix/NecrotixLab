import { bookingStatusLabel } from './status.mjs';
/** @param {unknown} value */
export function bookingCsvCell(value) {
    let text = value === null || value === undefined ? '' : String(value);
    // Prevent spreadsheet formulas, including a leading whitespace/control prefix.
    if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
}

/** @param {Array<import('@prisma/client').BookingReservation>} bookings */
export function bookingDataCsv(bookings) {
    const columns = ['id', 'calUid', 'status', 'customerName', 'email', 'phone', 'title', 'category', 'startTime', 'endTime', 'timeZone', 'platform', 'meetingUrl', 'meetingInstructions', 'notes', 'internalNotes', 'reason', 'rescheduledFromUid', 'rescheduledAt', 'createdAt', 'updatedAt'];
    const rows = bookings.map(booking => columns.map(key => {
        const value = key === 'status' ? bookingStatusLabel(booking) : booking[key];
        return bookingCsvCell(value instanceof Date ? value.toISOString() : value);
    }).join(','));
    return '\ufeff' + [columns.map(bookingCsvCell).join(','), ...rows].join('\r\n') + '\r\n';
}
