import 'server-only';
import type { BookingReservation, Prisma } from '@prisma/client';
import type { BookingConfig } from './settings';
import { reminderDue } from './workflow-policy';
export async function synchronizeBookingWorkflows(tx: Prisma.TransactionClient, reservation: BookingReservation, config: BookingConfig) {
    const cancelAll = reservation.status !== 'CONFIRMED' || !config.active || !config.reminderHours;
    await tx.bookingReminder.updateMany({ where: { reservationId: reservation.id, status: { in: ['PENDING', 'PROCESSING'] }, OR: [{ startTime: { not: reservation.startTime } }, ...(cancelAll ? [{}] : [{ hours: { not: config.reminderHours } }])] }, data: { status: 'CANCELLED', lockedUntil: null } });
    if (!config.active) return;
    if (config.autoProject && reservation.status === 'CONFIRMED') await tx.bookingProject.upsert({ where: { reservationId: reservation.id }, create: { reservationId: reservation.id, title: reservation.title }, update: {} });
    const dueAt = reminderDue(reservation.startTime, reservation.status, config.reminderHours, reservation.email);
    if (dueAt) {
        const key = { reservationId: reservation.id, startTime: reservation.startTime, hours: config.reminderHours };
        await tx.bookingReminder.upsert({ where: { reservationId_startTime_hours: key }, create: { ...key, dueAt }, update: {} });
        // Reconfirmation may reactivate a cancelled reminder, but never a sent one.
        const cancelAll = reservation.status !== 'CONFIRMED' || !config.active || !config.reminderHours;
    await tx.bookingReminder.updateMany({ where: { ...key, status: 'CANCELLED' }, data: { status: 'PENDING', dueAt, attempts: 0, lastError: '' } });
    }
}
