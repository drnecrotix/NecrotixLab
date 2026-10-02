'use server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
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
