import test from 'node:test';
import assert from 'node:assert/strict';
import { reminderDue, reminderMessageTime } from '../../Addons/Booking/workflow-policy.ts';
import { normalizeBookingConfig } from '../../Addons/Booking/settings.ts';
import { validBookingCronAuthorization } from '../../Addons/Booking/webhook.ts';
const now = new Date('2026-10-01T00:00:00Z');
const start = new Date('2026-10-03T10:00:00Z');
test('workflows stay disabled for existing addon configurations', () => {
    const config = normalizeBookingConfig({ installed: true, active: true });
    assert.equal(config.reminderHours, 0);
    assert.equal(config.autoProject, false);
    assert.equal(normalizeBookingConfig({ reminderHours: 24, autoProject: true }).reminderHours, 24);
    for (const value of [Infinity, -1, 5, 'broken']) assert.equal(normalizeBookingConfig({ reminderHours: value }).reminderHours, 0);
});
test('only confirmed bookings with a future reminder and valid email can schedule delivery', () => {
    assert.equal(reminderDue(start, 'CONFIRMED', 24, 'client@example.com', now).toISOString(), '2026-10-02T10:00:00.000Z');
    for (const status of ['PENDING', 'CANCELLED', 'REJECTED', 'COMPLETED', 'RESCHEDULED']) assert.equal(reminderDue(start, status, 24, 'client@example.com', now), null);
    for (const email of ['', 'bad', 'bad\r\n@example.com']) assert.equal(reminderDue(start, 'CONFIRMED', 24, email, now), null);
    assert.equal(reminderDue(start, 'CONFIRMED', 0, 'client@example.com', now), null);
    assert.equal(reminderDue(start, 'CONFIRMED', 24, 'client@example.com', new Date('2026-10-02T10:00:00Z')), null);
    assert.equal(reminderDue(start, 'CONFIRMED', 24, 'client@example.com', new Date('2026-10-04T00:00:00Z')), null);
});
test('reminder offset is an elapsed duration through daylight saving transitions', () => {
    const start = new Date('2026-10-25T10:00:00Z');
    const due = reminderDue(start, 'CONFIRMED', 24, 'client@example.com', now);
    assert.equal(start.getTime() - due.getTime(), 86400000);
});
test('invalid attendee timezones safely fall back without failing email delivery', () => {
    assert.match(reminderMessageTime(start, 'Europe/Sofia'), /Europe\/Sofia/);
    assert.match(reminderMessageTime(start, 'not-a-zone'), /Europe\/Sofia/);
    assert.match(reminderMessageTime(start, 'America/New_York'), /America\/New_York/);
});
test('cron requires the exact independent long bearer secret, including multibyte safety', () => {
    const secret = 'test-only-long-cron-secret-0123456789';
    assert.equal(validBookingCronAuthorization(`Bearer ${secret}`, secret), true);
    for (const header of [null, secret, `Bearer ${secret}x`, `Bearer ${'é'.repeat(secret.length)}`, `Bearer ${'x'.repeat(secret.length)}`]) assert.equal(validBookingCronAuthorization(header, secret), false);
    assert.equal(validBookingCronAuthorization('Bearer short', 'short'), false);
    assert.equal(validBookingCronAuthorization(`Bearer ${secret}`, undefined), false);
});
