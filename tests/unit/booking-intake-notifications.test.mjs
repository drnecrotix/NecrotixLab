import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { normalizeBookingContact, bookingContactUrl } from '../../Addons/Booking/intake.ts';
import { normalizeBookingConfig, safeMeetingUrl } from '../../Addons/Booking/settings.ts';
import { calendarForRecipient, bookingNotificationText } from '../../Addons/Booking/notification-policy.ts';
import { bookingCalendarInvitation, bookingCalendarCollection } from '../../Addons/Booking/calendar.ts';
const contact = { firstName: 'Никола', lastName: 'Стоянов', email: ' TEST@example.com ', phone: '+359 888 123 456' };
const booking = { id: 'one', calendarUid: 'provider-event', calendarSequence: 2, customerName: 'Test Customer', title: 'Consultation', category: 'Engineering', status: 'CONFIRMED', startTime: new Date('2026-10-25T10:00:00Z'), endTime: new Date('2026-10-25T10:30:00Z'), eventAt: new Date('2026-10-03T10:00:00Z'), timeZone: 'Europe/Sofia', platform: 'GOOGLE_MEET', meetingUrl: 'https://meet.google.com/test', meetingInstructions: 'Join five minutes early' };
test('intake requires both names, a bounded email and international telephone', () => {
    const result = normalizeBookingContact(contact); assert.equal(result.phone, '+359888123456'); assert.equal(result.email, 'test@example.com');
    for (const invalid of [{ firstName: '' }, { lastName: '' }, { email: 'bad' }, { phone: '0888123456' }, { firstName: '<script>' }, { phone: '+0' }, { lastName: 'x'.repeat(81) }]) assert.equal(normalizeBookingContact({ ...contact, ...invalid }), null);
    const url = new URL(bookingContactUrl('https://cal.example/owner/service', contact));
    assert.equal(url.searchParams.get('attendeePhoneNumber'), result.phone); assert.equal(url.searchParams.get('name'), 'Никола Стоянов');
});
test('calendar policy separates all/selected scope and both/client/host/off recipients', () => {
    for (const role of ['CLIENT', 'HOST']) {
        assert.equal(calendarForRecipient(normalizeBookingConfig({ calendarMode: 'ALL' }), false, role), true);
        assert.equal(calendarForRecipient(normalizeBookingConfig({ calendarMode: 'SELECTED' }), false, role), false);
        assert.equal(calendarForRecipient(normalizeBookingConfig({ calendarMode: 'SELECTED' }), true, role), true);
        assert.equal(calendarForRecipient(normalizeBookingConfig({ calendarRecipients: 'NONE' }), true, role), false);
    }
    assert.equal(calendarForRecipient(normalizeBookingConfig({ calendarRecipients: 'CLIENT' }), true, 'HOST'), false);
    assert.equal(calendarForRecipient(normalizeBookingConfig({ calendarRecipients: 'HOST' }), true, 'CLIENT'), false);
});
test('calendar requests, updates and cancellations keep UID/sequence and meeting details', () => {
    const invite = bookingCalendarInvitation(booking, 'host@example.com', 'client@example.com');
    assert.ok(invite.includes('METHOD:REQUEST')); assert.ok(invite.includes('UID:provider-event')); assert.ok(invite.includes('SEQUENCE:2')); assert.ok(invite.includes('https://meet.google.com/test'));
    const cancelled = bookingCalendarInvitation({ ...booking, status: 'CANCELLED', calendarSequence: 3 }, 'host@example.com', 'client@example.com');
    assert.ok(cancelled.includes('METHOD:CANCEL')); assert.ok(cancelled.includes('STATUS:CANCELLED')); assert.ok(cancelled.includes('UID:provider-event')); assert.ok(cancelled.includes('SEQUENCE:3'));
    assert.throws(() => bookingCalendarInvitation({ ...booking, status: 'PENDING' }, 'host@example.com', 'client@example.com'));
    assert.throws(() => bookingCalendarInvitation(booking, 'host@example.com\r\nEVIL', 'client@example.com'));
    const collection = bookingCalendarCollection([booking, { ...booking, id: 'two', calendarUid: 'other' }]);
    assert.equal(collection.match(/BEGIN:VCALENDAR/g).length, 1); assert.equal(collection.match(/BEGIN:VEVENT/g).length, 2);
    assert.throws(() => bookingCalendarCollection(Array(201).fill(booking)));
});
test('emails communicate pending versus confirmed and include platform, time and joining details', () => {
    const confirmed = bookingNotificationText(booking); assert.ok(confirmed.includes('GOOGLE MEET')); assert.ok(confirmed.includes(booking.meetingUrl)); assert.ok(confirmed.includes('Europe/Sofia')); assert.ok(confirmed.includes('Engineering'));
    const pending = bookingNotificationText({ ...booking, status: 'PENDING' }); assert.ok(pending.includes('Awaiting approval')); assert.ok(!pending.includes('Meeting link:'));
    assert.ok(bookingNotificationText({ ...booking, timeZone: 'invalid' }).includes('Europe/Sofia'));
});
test('meeting details match services by event ID, parse required phone, and use real provider location', () => {
    const source = readFileSync(new URL('../../Addons/Booking/meeting.ts', import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const loaded = { exports: {} }; new Function('exports', 'require', compiled)(loaded.exports, () => ({ safeMeetingUrl }));
    const config = normalizeBookingConfig({ services: [{ title: 'Engineering', path: 'owner/service', eventTypeId: 42, category: 'CNC', platform: 'VIBER', instructions: 'Call my work number' }] });
    const result = loaded.exports.bookingMeetingDetails({ eventTypeId: 42, responses: { attendeePhoneNumber: { value: '+359888123456' } }, location: 'integrations:google:meet', metadata: { videoCallUrl: 'https://meet.google.com/test' }, organizer: { email: 'HOST@example.com' } }, config);
    assert.equal(result.phone, '+359888123456'); assert.equal(result.platform, 'GOOGLE_MEET'); assert.equal(result.category, 'CNC'); assert.equal(result.organizerEmail, 'host@example.com');
    for (const url of ['javascript:alert(1)', 'https://user:password@example.com', 'http://example.com']) assert.equal(safeMeetingUrl(url), '');
});
