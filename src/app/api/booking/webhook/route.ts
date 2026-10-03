import { withinBookingRetention } from '@addons/Booking/retention.mjs';
import { bookingRescheduledAt } from '@addons/Booking/status.mjs';
import { after } from 'next/server';
import { bookingMeetingDetails } from '@addons/Booking/meeting';
import { queueBookingNotifications, processBookingNotifications } from '@addons/Booking/notifications';
import { prisma } from '@/lib/prisma';
import { bookingAddonConfig } from '@addons/Booking/server';
import { parseBookingEvent, validBookingSignature } from '@addons/Booking/webhook';
import { synchronizeBookingWorkflows } from '@addons/Booking/workflows';
export const runtime = 'nodejs';
export async function POST(request: Request) {
    const config = await bookingAddonConfig();
    if (!config.installed) return new Response('Booking not installed', { status: 503 });
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
    if (!event || !withinBookingRetention(event.data.eventAt)) return new Response('Ignored');
    const booking = event;
    try {
        await prisma.$transaction(async tx => {
            // Serialize deliveries, including two UIDs involved in a reschedule.
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(76431091)`;
            const existing = await tx.bookingReservation.findUnique({ where: { calUid: booking.uid } });
            if (existing && existing.eventAt >= booking.data.eventAt) return;
            const previous = booking.previousUid ? await tx.bookingReservation.findUnique({ where: { calUid: booking.previousUid } }) : null;
            const meeting = bookingMeetingDetails(booking.payload, config);
            const successor = await tx.bookingReservation.findFirst({ where: { rescheduledFromUid: booking.uid }, select: { id: true } });
            const data = { ...booking.data, ...meeting,
                servicePath: meeting.servicePath || existing?.servicePath || previous?.servicePath || '',
                category: meeting.category || existing?.category || previous?.category || '',
                meetingInstructions: meeting.meetingInstructions || existing?.meetingInstructions || previous?.meetingInstructions || '',
                platform: meeting.platform === 'CALDIY' ? existing?.platform || previous?.platform || meeting.platform : meeting.platform,
                phone: meeting.phone || existing?.phone || previous?.phone || '',
                organizerEmail: meeting.organizerEmail || existing?.organizerEmail || previous?.organizerEmail || '',
                meetingUrl: meeting.meetingUrl || (booking.data.status === 'CONFIRMED' ? existing?.meetingUrl : '') || '',
                calendarUid: previous?.calendarUid || existing?.calendarUid || meeting.calendarUid || `${booking.uid}@necrotixlab.com`,
                calendarSequence: Math.max(existing?.calendarSequence || 0, previous?.calendarSequence || 0) + 1,
                calendarSelected: existing?.calendarSelected ?? previous?.calendarSelected ?? false,
                rescheduledAt: bookingRescheduledAt(booking, existing, previous),
                status: successor ? 'RESCHEDULED' : booking.data.status,
                customerName: booking.data.customerName || existing?.customerName || '',
                email: (booking.data.email || existing?.email || '').trim().toLowerCase(), timeZone: booking.data.timeZone || existing?.timeZone || '',
                notes: booking.data.notes || existing?.notes || '',
                ...(booking.previousUid ? { rescheduledFromUid: booking.previousUid } : {}) };
            const reservation = await tx.bookingReservation.upsert({ where: { calUid: booking.uid }, create: { calUid: booking.uid, ...data }, update: data });
            if (booking.previousUid && booking.previousUid !== booking.uid) await tx.bookingReservation.updateMany({ where: { calUid: booking.previousUid, eventAt: { lt: booking.data.eventAt } }, data: { status: 'RESCHEDULED', eventAt: booking.data.eventAt } });
            if (booking.previousUid && booking.previousUid !== booking.uid) {
                const oldProject = await tx.bookingProject.findFirst({ where: { reservation: { calUid: booking.previousUid } } });
                const newProject = await tx.bookingProject.findUnique({ where: { reservationId: reservation.id } });
                if (oldProject && !newProject) await tx.bookingProject.update({ where: { id: oldProject.id }, data: { reservationId: reservation.id } });
            }
            await synchronizeBookingWorkflows(tx, reservation, config);
            await queueBookingNotifications(tx, reservation, config);
            if (booking.previousUid) await tx.bookingReminder.updateMany({ where: { reservation: { calUid: booking.previousUid }, status: { in: ['PENDING', 'PROCESSING'] } }, data: { status: 'CANCELLED', lockedUntil: null } });
        });
    } catch { return new Response('Unable to record event; retry later', { status: 503 }); }
    after(async () => { try { await processBookingNotifications(); } catch { /* Committed jobs are retried by the scheduler. */ } });
    return new Response('Recorded', { headers: { 'cache-control': 'no-store' } });
}
