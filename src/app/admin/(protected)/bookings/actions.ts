'use server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { after } from 'next/server';
import { redirect } from 'next/navigation';
import { bookingAddonConfig } from '@addons/Booking/server';
import { queueBookingNotifications, processBookingNotifications } from '@addons/Booking/notifications';
import { revalidatePath } from 'next/cache';
import { BOOKING_PROJECT_STATUSES } from '@addons/Booking/workflow-policy';
async function admin() {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) throw new Error('Forbidden');
}
export async function saveBookingNotes(id: string, form: FormData) {
    await admin();
    await prisma.bookingReservation.update({ where: { id }, data: { internalNotes: String(form.get('internalNotes') || '').trim().slice(0, 5000) } });
    revalidatePath(`/admin/bookings/${id}`);
}
export async function createBookingProject(id: string) {
    await admin();
    const booking = await prisma.bookingReservation.findUniqueOrThrow({ where: { id } });
    if (booking.status !== 'CONFIRMED' && booking.status !== 'COMPLETED') throw new Error('Confirm the booking before creating a project.');
    await prisma.bookingProject.upsert({ where: { reservationId: id }, create: { reservationId: id, title: booking.title }, update: {} });
    revalidatePath(`/admin/bookings/${id}`);
}
export async function saveBookingProject(id: string, form: FormData) {
    await admin();
    const status = String(form.get('status') || '');
    if (!BOOKING_PROJECT_STATUSES.some(value => value === status)) throw new Error('Invalid project status');
    const title = String(form.get('title') || '').trim().slice(0, 120);
    if (!title) throw new Error('A project title is required');
    await prisma.bookingProject.update({ where: { reservationId: id }, data: { title, status, notes: String(form.get('notes') || '').trim().slice(0, 5000) } });
    revalidatePath(`/admin/bookings/${id}`);
}

export async function saveBookingCalendarSelection(id: string, form: FormData) {
    await admin();
    const config = await bookingAddonConfig();
    if (!config.installed || !config.active) throw new Error('Activate Booking first.');
    await prisma.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(76431091)`;
        const booking = await tx.bookingReservation.update({ where: { id }, data: { calendarSelected: form.get('operation') === 'send' || form.get('calendarSelected') === 'on' } });
        if (form.get('operation') === 'send') await queueBookingNotifications(tx, booking, config, 'CALENDAR');
    });
    if (form.get('operation') === 'send') after(async () => { try { await processBookingNotifications([id]); } catch { /* Scheduler retries persisted jobs. */ } });
    revalidatePath(`/admin/bookings/${id}`); revalidatePath('/admin/bookings');
}

export async function sendBookingCalendarInvitations(form: FormData) {
    await admin();
    const config = await bookingAddonConfig();
    if (!config.installed || !config.active || config.calendarRecipients === 'NONE') redirect('/admin/bookings?error=Enable+calendar+invitations+in+Booking+settings');
    const ids = [...new Set(form.getAll('ids').map(String))];
    const all = form.get('scope') === 'all';
    if (!all && (!ids.length || ids.length > 200 || ids.some(id => id.length > 160))) redirect('/admin/bookings?error=Select+between+1+and+200+confirmed+bookings');
    const sentIds = await prisma.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(76431091)`;
        const bookings = await tx.bookingReservation.findMany({ where: { status: 'CONFIRMED', startTime: { gte: new Date() }, ...(!all ? { id: { in: ids } } : {}) }, orderBy: { startTime: 'asc' }, take: 201 });
        if (bookings.length > 200) return null;
        for (const booking of bookings) {
            const updated = await tx.bookingReservation.update({ where: { id: booking.id }, data: { calendarSelected: true } });
            await queueBookingNotifications(tx, updated, config, 'CALENDAR');
        }
        return bookings.map(item => item.id);
    }, { maxWait: 5000, timeout: 30000 });
    if (!sentIds) redirect('/admin/bookings?error=More+than+200+bookings.+Use+individual+selection');
    after(async () => { try { await processBookingNotifications(sentIds); } catch { /* Scheduler retries persisted jobs. */ } });
    revalidatePath('/admin/bookings'); redirect('/admin/bookings?queued=1');
}
