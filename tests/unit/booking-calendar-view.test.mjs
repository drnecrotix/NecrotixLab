import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingMonthDays, bookingMonthRange, shiftBookingMonth } from '../../Addons/Booking/calendar-view.ts';
test('calendar grids start on Monday, include leap days and cross year boundaries', () => {
    assert.equal(bookingMonthDays('2026-06')[0], '2026-06-01');
    assert.equal(bookingMonthDays('2026-10').filter(day => day === null).length, 3);
    assert.equal(bookingMonthDays('2024-02').filter(Boolean).length, 29);
    assert.deepEqual(bookingMonthDays('2026-13'), []);
    assert.equal(shiftBookingMonth('2026-12', 1), '2027-01');
    assert.equal(shiftBookingMonth('2026-01', -1), '2025-12');
});
test('admin month ranges follow Sofia DST boundaries rather than UTC months', () => {
    const spring = bookingMonthRange('2026-03');
    assert.equal(spring.gte.toISOString(), '2026-02-28T22:00:00.000Z');
    assert.equal(spring.lt.toISOString(), '2026-03-31T21:00:00.000Z');
    const autumn = bookingMonthRange('2026-10');
    assert.equal(autumn.gte.toISOString(), '2026-09-30T21:00:00.000Z');
    assert.equal(autumn.lt.toISOString(), '2026-10-31T22:00:00.000Z');
    for (const value of ['', '2026-13', 'not-a-month', '9999-10']) assert.equal(bookingMonthRange(value), null);
});
