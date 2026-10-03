import 'server-only';
import { createHash } from 'node:crypto';
import nodemailer from 'nodemailer';
import type { BookingReservation, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getRuntimeSmtpConfig } from '@/lib/integration-runtime';
import { getPublicSiteUrl } from '@/lib/social-metadata';
import { bookingAddonConfig } from './server';
import { bookingStatusLabel, bookingStatusCode } from './status.mjs';
import type { BookingConfig } from './settings';
import { bookingCalendarInvitation } from './calendar';
import { bookingCalendarGuestPath } from './calendar-access';
import { bookingNotificationText, calendarForRecipient, validBookingEmail } from './notification-policy';

export async function queueBookingNotifications(tx: Prisma.TransactionClient, booking: BookingReservation, config: BookingConfig, kind = 'UPDATE') {
    if (!config.installed || !config.active || !['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED'].includes(booking.status)) return;
    await tx.bookingNotification.updateMany({ where: { reservationId: booking.id, eventAt: { not: booking.eventAt }, status: { in: ['PENDING', 'PROCESSING'] } }, data: { status: 'CANCELLED', lockedUntil: null } });
    const targets = booking.email === booking.organizerEmail ? [[config.calendarRecipients === 'HOST' ? 'HOST' : 'CLIENT', booking.email]] : [['CLIENT', booking.email], ['HOST', booking.organizerEmail]];
    for (const [recipientRole, recipientEmail] of targets) {
        if (!validBookingEmail(recipientEmail)) continue;
        const previousInvite = await tx.bookingNotification.findFirst({ where: { reservation: { calendarUid: booking.calendarUid }, recipientRole, calendarAttached: true, status: 'SENT' } });
        const cancelled = ['CANCELLED', 'REJECTED'].includes(booking.status);
        const calendarAttached = cancelled ? Boolean(previousInvite) : booking.status === 'CONFIRMED' && calendarForRecipient(config, booking.calendarSelected, recipientRole);
        if (kind === 'CALENDAR' ? !calendarAttached : !config.confirmationEmails && !calendarAttached) continue;
        const fingerprint = createHash('sha256').update(JSON.stringify([bookingStatusCode(booking), booking.email, booking.customerName, +booking.startTime, +booking.endTime, booking.timeZone, booking.platform, booking.meetingUrl, booking.meetingInstructions, booking.category, calendarAttached])).digest('hex');
        const delivered = await tx.bookingNotification.findFirst({ where: { reservationId: booking.id, recipientRole, fingerprint, status: 'SENT' } });
        if (delivered) continue;
        if (kind === 'CALENDAR' && await tx.bookingNotification.findFirst({ where: { reservationId: booking.id, eventAt: booking.eventAt, recipientRole, calendarAttached: true, status: { in: ['PENDING', 'PROCESSING', 'SENT'] } } })) continue;
        const key = { reservationId: booking.id, eventAt: booking.eventAt, kind, recipientRole };
        await tx.bookingNotification.upsert({ where: { reservationId_eventAt_kind_recipientRole: key }, create: { ...key, recipientEmail, calendarAttached, fingerprint }, update: {} });
    }
}

export async function processBookingNotifications(ids?: string[]) {
    const config = await bookingAddonConfig();
    if (!config.installed || !config.active) return { disabled: true, sent: 0, failed: 0 };
    const smtp = await getRuntimeSmtpConfig();
    if (!smtp.user || !smtp.password) return { smtpConfigured: false, sent: 0, failed: 0 };
    const now = new Date(); let sent = 0; let failed = 0;
    await prisma.bookingNotification.updateMany({ where: { status: 'PROCESSING', lockedUntil: { lt: now }, attempts: { gte: 3 } }, data: { status: 'FAILED', lockedUntil: null, lastError: 'Final delivery lease expired; check mailbox before retrying.' } });
    const jobs = await prisma.bookingNotification.findMany({ where: { ...(ids ? { reservationId: { in: ids.slice(0, 200) } } : {}), dueAt: { lte: now }, attempts: { lt: 3 }, OR: [{ status: 'PENDING' }, { status: 'PROCESSING', lockedUntil: { lt: now } }] }, orderBy: { dueAt: 'asc' }, take: 10 });
    const transporter = nodemailer.createTransport({ host: smtp.host, port: smtp.port, secure: smtp.secure, auth: { user: smtp.user, pass: smtp.password }, connectionTimeout: 10000, socketTimeout: 20000 });
    try {
        for (const job of jobs) {
            const claim = await prisma.bookingNotification.updateMany({ where: { id: job.id, attempts: job.attempts, OR: [{ status: 'PENDING' }, { status: 'PROCESSING', lockedUntil: { lt: now } }] }, data: { status: 'PROCESSING', attempts: { increment: 1 }, lockedUntil: new Date(Date.now() + 600000) } });
            if (!claim.count) continue;
            const current = await prisma.bookingNotification.findUnique({ where: { id: job.id }, include: { reservation: true } });
            const booking = current?.reservation;
            if (!current || current.status !== 'PROCESSING' || !booking || +booking.eventAt !== +job.eventAt || !validBookingEmail(job.recipientEmail) || !['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED'].includes(booking.status)) {
                await prisma.bookingNotification.updateMany({ where: { id: job.id, status: 'PROCESSING' }, data: { status: 'CANCELLED', lockedUntil: null } }); continue;
            }
            const cancellation = ['CANCELLED', 'REJECTED'].includes(booking.status);
            const calendarAttached = job.calendarAttached && (cancellation || (booking.status === 'CONFIRMED' && calendarForRecipient(config, booking.calendarSelected, job.recipientRole)));
            if ((job.kind === 'CALENDAR' && !calendarAttached) || (!config.confirmationEmails && !calendarAttached)) {
                await prisma.bookingNotification.updateMany({ where: { id: job.id, status: 'PROCESSING' }, data: { status: 'CANCELLED', lockedUntil: null } }); continue;
            }
            try {
                const guestPath = job.recipientRole === 'CLIENT' && calendarAttached && !cancellation ? bookingCalendarGuestPath(booking, process.env.AUTH_SECRET) : null;
                const invitation = calendarAttached ? bookingCalendarInvitation(booking, booking.organizerEmail || smtp.user, booking.email) : null;
                await transporter.sendMail({ from: smtp.user, to: job.recipientEmail, subject: `Booking ${bookingStatusLabel(booking)}: ${booking.title.replace(/[\r\n]/g, ' ')}`, messageId: `<booking-notification-${job.id}@necrotixlab.com>`,
                    text: bookingNotificationText(booking, guestPath ? `${getPublicSiteUrl()}${guestPath}` : ''),
                    ...(invitation ? { icalEvent: { method: cancellation ? 'CANCEL' : 'REQUEST', content: invitation } } : {}),
                });
                await prisma.bookingNotification.updateMany({ where: { id: job.id, status: 'PROCESSING' }, data: { status: 'SENT', sentAt: new Date(), lockedUntil: null, lastError: '', calendarAttached } }); sent++;
            } catch {
                await prisma.bookingNotification.updateMany({ where: { id: job.id, status: 'PROCESSING' }, data: { status: job.attempts + 1 >= 3 ? 'FAILED' : 'PENDING', dueAt: new Date(Date.now() + 300000 * (job.attempts + 1)), lockedUntil: null, lastError: 'Delivery failed; check SMTP and recipient.' } }); failed++;
            }
        }
    } finally { transporter.close(); }
    return { sent, failed };
}
