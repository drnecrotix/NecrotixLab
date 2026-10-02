import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { parseBookingEvent, validBookingSignature } from '../../Addons/Booking/webhook.ts';
const secret = 'test-only-secret-that-is-longer-than-32-characters';
const fixture = { triggerEvent: 'BOOKING_CREATED', createdAt: '2026-10-02T12:00:00Z', payload: { uid: 'booking-1', title: 'Consultation', startTime: '2026-10-03T10:00:00Z', endTime: '2026-10-03T10:30:00Z', attendees: [{ name: 'Test', email: 'test@example.com', timeZone: 'Europe/Sofia' }] } };
test('webhook verifies exact raw body and supports upstream signature formats', () => {
    const raw = JSON.stringify(fixture); const signature = createHmac('sha256', secret).update(raw).digest('hex');
    assert.equal(validBookingSignature(raw, `sha256=${signature}`, secret), true);
    assert.equal(validBookingSignature(raw, signature, secret), true);
    assert.equal(validBookingSignature(raw + ' ', signature, secret), false);
    for (const bad of [null, 'fake', 'f'.repeat(64)]) assert.equal(validBookingSignature(raw, bad, secret), false);
    assert.equal(validBookingSignature(raw, signature, 'short'), false);
});
test('webhook maps lifecycle statuses and captures reschedule lineage', () => {
    for (const [trigger, status] of [['BOOKING_REQUESTED','PENDING'],['BOOKING_CONFIRMED','CONFIRMED'],['BOOKING_CANCELLED','CANCELLED'],['BOOKING_REJECTED','REJECTED'],['MEETING_ENDED','COMPLETED']]) assert.equal(parseBookingEvent({ ...fixture, triggerEvent: trigger }).data.status, status);
    const moved = parseBookingEvent({ ...fixture, triggerEvent: 'BOOKING_RESCHEDULED', payload: { ...fixture.payload, uid: 'booking-2', rescheduleUid: 'booking-1' } });
    assert.equal(moved.previousUid, 'booking-1');
    assert.equal(moved.uid, 'booking-2');
    assert.equal(moved.data.email, 'test@example.com');
    assert.equal(parseBookingEvent({ ...fixture, triggerEvent: 'UNKNOWN' }), null);
});
test('webhook rejects malformed appointment ranges rather than storing invalid records', () => {
    for (const payload of [{ ...fixture.payload, uid: '' }, { ...fixture.payload, startTime: 'bad' }, { ...fixture.payload, endTime: '2026-10-03T09:00:00Z' }]) assert.throws(() => parseBookingEvent({ ...fixture, payload }));
    assert.throws(() => parseBookingEvent({ ...fixture, createdAt: 'bad' }));
});
