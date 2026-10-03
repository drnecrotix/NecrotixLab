import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingStatusCode, bookingStatusLabel, bookingStatusFilter, bookingRescheduledAt } from '../../Addons/Booking/status.mjs';
import { bookingRetentionCutoff, expiredBookingFilter, withinBookingRetention } from '../../Addons/Booking/retention.mjs';
import { bookingDataCsv, bookingCsvCell } from '../../Addons/Booking/export.mjs';
const now = new Date('2026-10-03T05:00:00Z');
test('booking labels unify declines and retain rescheduled status across confirmation', () => {
    assert.equal(bookingStatusLabel({ status: 'CONFIRMED' }), 'Одобрен / Approved');
    assert.equal(bookingStatusLabel({ status: 'PENDING' }), 'В изчакване / Pending');
    assert.equal(bookingStatusCode({ status: 'CONFIRMED', rescheduledAt: now }), 'RESCHEDULED');
    assert.equal(bookingStatusCode({ status: 'CONFIRMED', rescheduledFromUid: 'old' }), 'RESCHEDULED');
    for (const status of ['REJECTED', 'CANCELLED']) assert.equal(bookingStatusLabel({ status }), 'Отказан / Declined');
    assert.equal(bookingStatusCode({ status: 'PENDING', rescheduledAt: now }), 'PENDING');
    assert.equal(bookingStatusCode({ status: 'CANCELLED', rescheduledAt: now }), 'DECLINED');
});
test('reschedule filters include replaced records and active bookings with changed dates', () => {
    const filter = bookingStatusFilter('RESCHEDULED');
    assert.equal(filter.OR[0].status, 'RESCHEDULED'); assert.equal(filter.OR[1].status, 'CONFIRMED');
    assert.deepEqual(bookingStatusFilter('DECLINED'), { status: { in: ['CANCELLED', 'REJECTED'] } });
    assert.deepEqual(bookingStatusFilter('CONFIRMED'), { status: 'CONFIRMED', rescheduledAt: null, rescheduledFromUid: null });
    assert.deepEqual(bookingStatusFilter('ACTIVE'), { status: 'CONFIRMED' });
});
test('same-UID and new-UID reschedules persist history without resetting on approval', () => {
    const data = { eventAt: now, startTime: new Date(+now + 86400000), endTime: new Date(+now + 88200000) };
    assert.equal(bookingRescheduledAt({ trigger: 'BOOKING_RESCHEDULED', data }, null, null), now);
    assert.equal(bookingRescheduledAt({ trigger: 'BOOKING_CONFIRMED', data }, { ...data, startTime: now }, null), now);
    const old = new Date(+now - 86400000);
    assert.equal(bookingRescheduledAt({ trigger: 'BOOKING_CONFIRMED', data }, { ...data, rescheduledAt: old }, null), old);
});
test('retention uses exactly 30 days and terminal event versus meeting-end boundaries', () => {
    const cutoff = bookingRetentionCutoff(now); assert.equal(+now - +cutoff, 30 * 86400000);
    assert.equal(withinBookingRetention(cutoff, now), false); assert.equal(withinBookingRetention(new Date(+cutoff + 1), now), true);
    const filter = expiredBookingFilter(now); assert.equal(+filter.OR[0].eventAt.lte, +cutoff); assert.equal(+filter.OR[1].endTime.lte, +cutoff);
    assert.deepEqual(filter.OR[0].status.in, ['CANCELLED', 'REJECTED', 'RESCHEDULED']);
});
test('CSV exports preserve Cyrillic and escaping while disabling spreadsheet formula payloads', () => {
    for (const input of ['=1+1', '+359888123456', '-2+3', '@SUM(A1)', '\n =cmd']) assert.ok(bookingCsvCell(input).startsWith('"\''));
    assert.equal(bookingCsvCell('a,"b"'), '"a,""b"""');
    const csv = bookingDataCsv([{ id: 'one', status: 'CONFIRMED', customerName: 'Никола Стоянов', email: 'n@example.com', phone: '+359888123456', startTime: now, rescheduledAt: now, title: 'CNC, consultation' }]);
    assert.ok(csv.startsWith('\ufeff')); assert.ok(csv.includes('Никола Стоянов')); assert.ok(csv.includes('Пренасочен / Rescheduled')); assert.ok(csv.includes(now.toISOString())); assert.ok(csv.includes('"CNC, consultation"'));
});
