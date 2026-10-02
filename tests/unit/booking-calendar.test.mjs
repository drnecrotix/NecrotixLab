import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingCalendarIcs, bookingCalendarLinks, canAddBookingToCalendar, foldCalendarLine } from '../../Addons/Booking/calendar.ts';
import { bookingCalendarToken, bookingCalendarGuestPath, validBookingCalendarToken } from '../../Addons/Booking/calendar-access.ts';
const event = { id: 'test-booking', title: 'Консултация & planning', status: 'CONFIRMED', email: 'private@example.com', startTime: new Date('2026-10-25T10:00:00Z'), endTime: new Date('2026-10-25T10:30:00Z'), eventAt: new Date('2026-10-02T10:00:00Z'), internalNotes: 'Do not export', notes: 'Private attendee text' };
const secret = 'test-only-calendar-secret-0123456789';
test('calendar providers receive UTC dates and escaped title without private customer data', () => {
    const urls = bookingCalendarLinks(event);
    const google = new URL(urls.google); const outlook = new URL(urls.outlook); const microsoft = new URL(urls.microsoft365);
    assert.equal(google.hostname, 'calendar.google.com');
    assert.equal(google.searchParams.get('text'), event.title);
    assert.equal(google.searchParams.get('dates'), '20261025T100000Z/20261025T103000Z');
    assert.equal(outlook.hostname, 'outlook.live.com'); assert.equal(microsoft.hostname, 'outlook.office.com');
    assert.equal(outlook.searchParams.get('startdt'), event.startTime.toISOString());
    for (const url of Object.values(urls)) { assert.ok(!url.includes('private')); assert.ok(!url.includes('token=')); }
});
test('ICS uses CRLF, UTC, a stable UID and excludes private booking fields', () => {
    const text = bookingCalendarIcs(event);
    assert.ok(text.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n'));
    assert.ok(text.endsWith('END:VCALENDAR\r\n'));
    assert.ok(text.includes('DTSTART:20261025T100000Z\r\nDTEND:20261025T103000Z'));
    assert.ok(text.includes('UID:test-booking@necrotixlab.com'));
    for (const privateValue of [event.email, event.internalNotes, event.notes]) assert.ok(!text.includes(privateValue));
});
test('ICS escapes injection delimiters and folds at 75 UTF-8 octets without corrupting text', () => {
    const title = 'А😀'.repeat(40) + ',;\\\r\nBEGIN:VEVENT';
    const text = bookingCalendarIcs({ ...event, title });
    for (const line of text.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
    assert.equal(text.split('\r\n').filter(line => line === 'BEGIN:VEVENT').length, 1);
    const unfolded = text.replace(/\r\n /g, '');
    assert.ok(unfolded.includes('\\,\\;\\\\\\nBEGIN:VEVENT'));
    assert.ok(!text.includes('\ufffd'));
    assert.equal(foldCalendarLine('x'.repeat(75)), 'x'.repeat(75));
});
test('unconfirmed, cancelled and superseded bookings cannot be added', () => {
    for (const status of ['PENDING', 'CANCELLED', 'REJECTED', 'RESCHEDULED']) {
        assert.equal(canAddBookingToCalendar({ ...event, status }), false);
        assert.throws(() => bookingCalendarIcs({ ...event, status }));
        assert.throws(() => bookingCalendarLinks({ ...event, status }));
    }
});
test('private access is signed, bound to the booking version and expires 30 days after it ends', () => {
    const token = bookingCalendarToken(event, secret);
    const now = new Date('2026-10-02T12:00:00Z');
    assert.equal(validBookingCalendarToken(event, token, secret, now), true);
    for (const changed of [{ ...event, id: 'other' }, { ...event, email: 'other@example.com' }, { ...event, eventAt: new Date(+event.eventAt + 1) }, { ...event, startTime: new Date(+event.startTime + 1000) }]) assert.equal(validBookingCalendarToken(changed, token, secret, now), false);
    assert.equal(validBookingCalendarToken(event, token, 'wrong-secret-that-is-more-than-32-characters', now), false);
    assert.equal(validBookingCalendarToken(event, token, secret, new Date(+event.endTime + 30 * 86400000 + 1)), false);
    for (const bad of ['', 'é'.repeat(43), 'x'.repeat(43)]) assert.equal(validBookingCalendarToken(event, bad, secret, now), false);
    assert.equal(bookingCalendarToken(event, 'short'), null);
    assert.equal(bookingCalendarGuestPath(event, undefined), null);
});
