import { createHmac, timingSafeEqual } from 'node:crypto';
export function validBookingSignature(body: string, signature: string | null, secret: string | undefined) {
    if (!secret || secret.length < 32 || !signature) return false;
    const hex = signature.replace(/^sha256=/, '');
    if (!/^[a-f0-9]{64}$/i.test(hex)) return false;
    return timingSafeEqual(Buffer.from(hex, 'hex'), createHmac('sha256', secret).update(body).digest());
}
const statuses: Record<string, string> = { BOOKING_CREATED: 'CONFIRMED', BOOKING_REQUESTED: 'PENDING', BOOKING_CONFIRMED: 'CONFIRMED', BOOKING_CANCELLED: 'CANCELLED', BOOKING_REJECTED: 'REJECTED', BOOKING_RESCHEDULED: 'CONFIRMED', MEETING_ENDED: 'COMPLETED' };
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown, max: number) => typeof value === 'string' ? value.slice(0, max) : '';
const date = (value: unknown) => { const d = new Date(typeof value === 'string' ? value : 'invalid'); return Number.isFinite(d.getTime()) ? d : null; };
export function parseBookingEvent(value: unknown) {
    const root = record(value); const trigger = text(root.triggerEvent, 80); const status = statuses[trigger];
    if (!status) return null;
    const payload = record(root.payload); const uid = text(payload.uid, 160);
    const eventAt = date(root.createdAt); const startTime = date(payload.startTime); const endTime = date(payload.endTime);
    if (!uid || !eventAt || !startTime || !endTime || endTime <= startTime) throw new Error('Invalid booking event');
    const attendee = record(Array.isArray(payload.attendees) ? payload.attendees[0] : null);
    return { uid, payload, trigger, previousUid: trigger === 'BOOKING_RESCHEDULED' ? text(payload.rescheduleUid, 160) : '',
        data: { status: (payload.status === 'PENDING' || (payload.requiresConfirmation === true && payload.status !== 'ACCEPTED')) && ['BOOKING_CREATED', 'BOOKING_RESCHEDULED'].includes(trigger) ? 'PENDING' : status,
            title: text(payload.title, 200), customerName: text(attendee.name, 200), email: text(attendee.email, 254), timeZone: text(attendee.timeZone, 100), startTime, endTime,
            notes: text(payload.description, 3000), reason: text(payload.cancellationReason || payload.reschedulingReason || payload.rejectionReason, 1000), eventAt } };
}

export function validBookingCronAuthorization(header: string | null, secret: string | undefined) {
    if (!secret || secret.length < 32 || !header?.startsWith('Bearer ') || header.length > 4096) return false;
    const supplied = Buffer.from(header.slice(7)); const expected = Buffer.from(secret);
    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
