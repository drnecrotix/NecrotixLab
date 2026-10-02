import { createHmac, timingSafeEqual } from 'node:crypto';
import type { BookingCalendarEvent } from './calendar';
type CalendarAccessEvent = BookingCalendarEvent & { email: string };
export function bookingCalendarToken(event: CalendarAccessEvent, secret: string | undefined) {
    if (!secret || secret.length < 32) return null;
    // Domain separation prevents use of this token as a session/status credential.
    return createHmac('sha256', secret).update(JSON.stringify(['booking-calendar-v1', event.id, event.email, +event.eventAt, +event.startTime, +event.endTime])).digest('base64url');
}
export function validBookingCalendarToken(event: CalendarAccessEvent, token: string, secret: string | undefined, now = new Date()) {
    if (+now > +event.endTime + 30 * 86400000) return false;
    const expected = bookingCalendarToken(event, secret);
    if (!expected || !/^[A-Za-z0-9_-]{43}$/.test(token)) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}
export function bookingCalendarGuestPath(event: CalendarAccessEvent, secret: string | undefined) {
    if (Date.now() > +event.endTime + 30 * 86400000) return null;
    const token = bookingCalendarToken(event, secret);
    return token ? `/booking/calendar/${encodeURIComponent(event.id)}?token=${token}` : null;
}
