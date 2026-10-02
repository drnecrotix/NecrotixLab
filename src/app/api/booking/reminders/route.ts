import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { getRuntimeSmtpConfig } from '@/lib/integration-runtime';
import { bookingAddonConfig } from '@addons/Booking/server';
import { reminderMessageTime } from '@addons/Booking/workflow-policy';
import { validBookingCronAuthorization } from '@addons/Booking/webhook';
export const runtime = 'nodejs';
export async function POST(request: Request) {
    const header = request.headers.get('authorization'); const secret = process.env.BOOKING_CRON_SECRET;
    if (!validBookingCronAuthorization(header, secret)) return new Response('Unauthorized', { status: 401 });
    const config = await bookingAddonConfig();
    if (!config.installed || !config.active || !config.reminderHours) return Response.json({ disabled: true });
    const smtp = await getRuntimeSmtpConfig();
    if (!smtp.user || !smtp.password) return new Response('SMTP not configured', { status: 503 });
    const transporter = nodemailer.createTransport({ host: smtp.host, port: smtp.port, secure: smtp.secure, auth: { user: smtp.user, pass: smtp.password }, connectionTimeout: 10000, socketTimeout: 20000 });
    const now = new Date(); let sent = 0; let failed = 0;
    await prisma.bookingReminder.updateMany({ where: { status: 'PROCESSING', lockedUntil: { lt: now }, attempts: { gte: 3 } }, data: { status: 'FAILED', lockedUntil: null, lastError: 'Delivery lease expired after the final attempt; verify delivery before retrying.' } });
    const jobs = await prisma.bookingReminder.findMany({ where: { dueAt: { lte: now }, attempts: { lt: 3 }, OR: [{ status: 'PENDING' }, { status: 'PROCESSING', lockedUntil: { lt: now } }] }, orderBy: { dueAt: 'asc' }, take: 10 });
    for (const job of jobs) {
        const claimed = await prisma.bookingReminder.updateMany({ where: { id: job.id, attempts: job.attempts, OR: [{ status: 'PENDING' }, { status: 'PROCESSING', lockedUntil: { lt: now } }] }, data: { status: 'PROCESSING', lockedUntil: new Date(Date.now() + 600000), attempts: { increment: 1 } } });
        if (!claimed.count) continue;
        const current = await prisma.bookingReminder.findUnique({ where: { id: job.id }, include: { reservation: true } });
        const booking = current?.reservation;
        if (!current || current.status !== 'PROCESSING' || !booking || booking.status !== 'CONFIRMED' || booking.startTime <= new Date() || booking.startTime.getTime() !== job.startTime.getTime() || job.hours !== config.reminderHours || !booking.email) {
            await prisma.bookingReminder.updateMany({ where: { id: job.id, status: 'PROCESSING' }, data: { status: 'CANCELLED', lockedUntil: null } }); continue;
        }
        try {
            const time = reminderMessageTime(booking.startTime, booking.timeZone);
            await transporter.sendMail({ from: smtp.user, to: booking.email, subject: `Reminder: ${booking.title.replace(/[\r\n]/g, ' ')}`, messageId: `<booking-reminder-${job.id}@necrotixlab.com>`, text: `Hello ${booking.customerName},\n\nYour appointment: ${booking.title}\n${time}\n\nUse the links in your original Cal.diy confirmation to cancel or reschedule.\n\nNecrotixLab` });
            await prisma.bookingReminder.updateMany({ where: { id: job.id, status: 'PROCESSING' }, data: { status: 'SENT', sentAt: new Date(), lockedUntil: null, lastError: '' } }); sent++;
        } catch {
            // Keep SMTP errors and recipient details out of the public cron response.
            await prisma.bookingReminder.updateMany({ where: { id: job.id, status: 'PROCESSING' }, data: { status: job.attempts + 1 >= 3 ? 'FAILED' : 'PENDING', dueAt: new Date(Date.now() + 300000 * (job.attempts + 1)), lockedUntil: null, lastError: 'Delivery failed; check SMTP configuration and recipient address.' } }); failed++;
        }
    }
    transporter.close();
    return Response.json({ sent, failed }, { headers: { 'cache-control': 'no-store' } });
}
