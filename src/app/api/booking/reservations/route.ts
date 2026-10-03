import { after } from 'next/server';
import { bookingAddonConfig } from '@addons/Booking/server';
import { bookingReady } from '@addons/Booking/settings';
import { normalizeBookingContact } from '@addons/Booking/intake';
import { createNativeBooking, BookingConflict } from '@addons/Booking/native';
import { processBookingNotifications } from '@addons/Booking/notifications';
export const runtime = 'nodejs';
const failure = (error: string, status: number) => Response.json({ error }, { status, headers: { 'cache-control': 'no-store' } });
export async function POST(request: Request) {
    if (request.headers.get('origin') !== new URL(request.url).origin) return failure('Forbidden', 403);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return failure('JSON required', 415);
    if (!request.body) return failure('Empty body', 400);
    const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    try { while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 4096) { await reader.cancel(); return failure('Too large', 413); } chunks.push(value); } } finally { reader.releaseLock(); }
    let raw; try { raw = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return failure('Invalid request', 400); }
    if (!raw || typeof raw !== 'object' || !['firstName', 'lastName', 'email', 'phone', 'serviceId', 'startTime', 'requestId'].every(key => typeof raw[key] === 'string')) return failure('Invalid fields', 400);
    const contact = normalizeBookingContact(raw); const start = new Date(raw.startTime);
    if (!contact || !Number.isFinite(+start) || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(raw.requestId) || raw.serviceId.length > 40) return failure('Enter valid contact details and a time', 400);
    const config = await bookingAddonConfig(); if (!bookingReady(config)) return failure('Booking unavailable', 503);
    const ip = (request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown').trim().slice(0, 120);
    try {
        const booking = await createNativeBooking(config, contact, raw.serviceId, start, raw.requestId, ip);
        after(async () => { try { await processBookingNotifications([booking.id]); } catch { /* Persisted outbox is retried by cron. */ } });
        return Response.json({ status: booking.status, startTime: booking.startTime, endTime: booking.endTime, timeZone: booking.timeZone, title: booking.title }, { status: 201, headers: { 'cache-control': 'no-store' } });
    } catch (error) {
        return Response.json({ error: error instanceof BookingConflict ? error.message : 'Unable to save your booking. Try again.' }, { status: error instanceof BookingConflict ? 409 : 503 });
    }
}
