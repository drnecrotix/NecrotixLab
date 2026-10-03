import 'server-only';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { BOOKING_CONFIG_SLUG, bookingReady, normalizeBookingConfig, type BookingConfig } from './settings';
import { availableSlots, localParts, overlaps } from './availability';
import { synchronizeBookingWorkflows } from './workflows';
import { queueBookingNotifications } from './notifications';
import type { BookingContact } from './intake';
export class BookingConflict extends Error {}
export async function nativeSlots(config: BookingConfig, serviceId: string, day: string) {
    const service = config.services.find(item => item.id === serviceId); if (!service) return [];
    const anchor = Date.parse(`${day}T00:00:00Z`); if (!Number.isFinite(anchor)) return [];
    const busy = await prisma.bookingReservation.findMany({ where: { status: { in: ['PENDING', 'CONFIRMED'] }, startTime: { lt: new Date(anchor + 3 * 86400000) }, endTime: { gt: new Date(anchor - 2 * 86400000) } }, select: { startTime: true, endTime: true } });
    return availableSlots(config, service.duration, day, busy);
}
export async function createNativeBooking(config: BookingConfig, contact: BookingContact, serviceId: string, startTime: Date, requestId: string, ip: string) {
    return prisma.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(76431091)`;
        const stored = await tx.page.findUnique({ where: { slug: BOOKING_CONFIG_SLUG }, select: { content: true } });
        config = normalizeBookingConfig(stored?.content); if (!bookingReady(config)) throw new BookingConflict('Booking unavailable');
        const service = config.services.find(item => item.id === serviceId); if (!service) throw new BookingConflict('Invalid service');
        const calUid = `native:${requestId}`;
        const existing = await tx.bookingReservation.findUnique({ where: { calUid } });
        if (existing) {
            if (existing.email !== contact.email || existing.servicePath !== service.id || +existing.startTime !== +startTime || existing.phone !== contact.phone || existing.customerName !== `${contact.firstName} ${contact.lastName}`) throw new BookingConflict('Request already used');
            return existing;
        }
        const now = new Date(); const bucket = Math.floor(+now / 1800000);
        await tx.bookingRateLimit.deleteMany({ where: { expiresAt: { lt: now } } });
        for (const input of [`ip:${ip}`, `email:${contact.email}`]) {
            const key = createHash('sha256').update(`${bucket}:${input}`).digest('hex');
            const rate = await tx.bookingRateLimit.upsert({ where: { key }, create: { key, expiresAt: new Date(+now + 3600000) }, update: { count: { increment: 1 } } });
            if (rate.count > 5) throw new BookingConflict('Too many requests. Try again later.');
        }
        const endTime = new Date(+startTime + service.duration * 60000);
        const busy = await tx.bookingReservation.findMany({ where: { status: { in: ['PENDING', 'CONFIRMED'] }, startTime: { lt: new Date(+endTime + config.bufferMinutes * 60000) }, endTime: { gt: new Date(+startTime - config.bufferMinutes * 60000) } }, select: { startTime: true, endTime: true } });
        const day = localParts(startTime, config.timeZone).date;
        if (!availableSlots(config, service.duration, day, busy, now).includes(startTime.toISOString())) throw new BookingConflict('This time is no longer available. Choose another time.');
        const booking = await tx.bookingReservation.create({ data: { calUid, source: 'NATIVE', calendarUid: `${requestId}@necrotixlab.com`, calendarSequence: 1, status: config.approvalRequired ? 'PENDING' : 'CONFIRMED', title: service.title, customerName: `${contact.firstName} ${contact.lastName}`, email: contact.email, phone: contact.phone, timeZone: config.timeZone, startTime, endTime, eventAt: now, servicePath: service.id, category: service.category, platform: service.platform === 'CALDIY' ? 'OTHER' : service.platform, meetingUrl: service.meetingUrl, meetingInstructions: service.instructions, organizerEmail: config.organizerEmail } });
        await synchronizeBookingWorkflows(tx, booking, config); await queueBookingNotifications(tx, booking, config);
        return booking;
    }, { timeout: 15000 });
}
export async function manageNativeBooking(config: BookingConfig, id: string, operation: string, newStart: Date | null, meetingUrl: string, instructions: string) {
    return prisma.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(76431091)`;
        const stored = await tx.page.findUnique({ where: { slug: BOOKING_CONFIG_SLUG }, select: { content: true } });
        config = normalizeBookingConfig(stored?.content); if (!config.installed || !config.active) throw new BookingConflict('Booking unavailable');
        const booking = await tx.bookingReservation.findUniqueOrThrow({ where: { id } });
        if (booking.source !== 'NATIVE') throw new BookingConflict('Legacy provider bookings remain read-only; manage them at their original provider.');
        if (!['approve', 'decline', 'reschedule', 'details'].includes(operation)) throw new BookingConflict('Invalid operation');
        if (operation !== 'details' && !['PENDING', 'CONFIRMED'].includes(booking.status)) throw new BookingConflict('This booking is no longer active.');
        const startTime = operation === 'reschedule' ? newStart : booking.startTime;
        if (!startTime || ((operation === 'approve' || operation === 'reschedule') && +startTime < Date.now())) throw new BookingConflict('Choose a future time.');
        const endTime = new Date(+startTime + (+booking.endTime - +booking.startTime));
        if (operation === 'approve' || operation === 'reschedule') {
            const busy = await tx.bookingReservation.findMany({ where: { id: { not: id }, status: { in: ['PENDING', 'CONFIRMED'] }, startTime: { lt: new Date(+endTime + config.bufferMinutes * 60000) }, endTime: { gt: new Date(+startTime - config.bufferMinutes * 60000) } }, select: { startTime: true, endTime: true } });
            if (overlaps(startTime, endTime, busy, config.bufferMinutes)) throw new BookingConflict('Another booking overlaps this time.');
            if (operation === 'reschedule' && !availableSlots(config, (+endTime - +startTime) / 60000, localParts(startTime, config.timeZone).date, busy).includes(startTime.toISOString())) throw new BookingConflict('Choose a time within the configured availability.');
        }
        const updated = await tx.bookingReservation.update({ where: { id }, data: { status: operation === 'decline' ? 'REJECTED' : operation === 'approve' || operation === 'reschedule' ? 'CONFIRMED' : booking.status, startTime, endTime, meetingUrl, meetingInstructions: instructions, eventAt: new Date(Math.max(Date.now(), +booking.eventAt + 1)), calendarSequence: { increment: 1 }, ...(operation === 'reschedule' ? { timeZone: config.timeZone } : {}), ...(operation === 'reschedule' && +startTime !== +booking.startTime ? { rescheduledAt: new Date() } : {}) } });
        await synchronizeBookingWorkflows(tx, updated, config); await queueBookingNotifications(tx, updated, config); return updated;
    }, { timeout: 15000 });
}
