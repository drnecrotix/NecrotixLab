import { prisma } from '@/lib/prisma';
import { bookingAddonConfig } from '@addons/Booking/server';
import { parseBookingEvent, validBookingSignature } from '@addons/Booking/webhook';
export const runtime = 'nodejs';
export async function POST(request: Request) {
    if (!(await bookingAddonConfig()).installed) return new Response('Booking not installed', { status: 503 });
    if (!process.env.CALDIY_WEBHOOK_SECRET || process.env.CALDIY_WEBHOOK_SECRET.length < 32) return new Response('Webhook not configured', { status: 503 });
    if (Number(request.headers.get('content-length')) > 65536) return new Response('Too large', { status: 413 });
    if (!request.body) return new Response('Empty body', { status: 400 });
    const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    try {
        while (true) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > 65536) { await reader.cancel(); return new Response('Too large', { status: 413 }); } chunks.push(value); }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const body = new TextDecoder().decode(bytes);
    if (!validBookingSignature(body, request.headers.get('x-cal-signature-256'), process.env.CALDIY_WEBHOOK_SECRET)) return new Response('Invalid signature', { status: 401 });
    let event;
    try { event = parseBookingEvent(JSON.parse(body)); } catch { return new Response('Invalid event', { status: 400 }); }
    if (!event) return new Response('Ignored');
    const booking = event;
    try {
        await prisma.$transaction(async tx => {
            // Serialize deliveries, including two UIDs involved in a reschedule.
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(76431091)`;
            const existing = await tx.bookingReservation.findUnique({ where: { calUid: booking.uid } });
            if (existing && existing.eventAt >= booking.data.eventAt) return;
            const successor = await tx.bookingReservation.findFirst({ where: { rescheduledFromUid: booking.uid }, select: { id: true } });
            const data = { ...booking.data, status: successor ? 'RESCHEDULED' : booking.data.status,
                customerName: booking.data.customerName || existing?.customerName || '',
                email: booking.data.email || existing?.email || '', timeZone: booking.data.timeZone || existing?.timeZone || '',
                notes: booking.data.notes || existing?.notes || '',
                ...(booking.previousUid ? { rescheduledFromUid: booking.previousUid } : {}) };
            await tx.bookingReservation.upsert({ where: { calUid: booking.uid }, create: { calUid: booking.uid, ...data }, update: data });
            if (booking.previousUid && booking.previousUid !== booking.uid) await tx.bookingReservation.updateMany({ where: { calUid: booking.previousUid, eventAt: { lt: booking.data.eventAt } }, data: { status: 'RESCHEDULED', eventAt: booking.data.eventAt } });
        });
    } catch { return new Response('Unable to record event; retry later', { status: 503 }); }
    return new Response('Recorded', { headers: { 'cache-control': 'no-store' } });
}
