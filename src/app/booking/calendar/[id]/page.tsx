import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { canAddBookingToCalendar } from '@addons/Booking/calendar';
import { validBookingCalendarToken } from '@addons/Booking/calendar-access';
import { CalendarActions } from '@addons/Booking/CalendarActions';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Add appointment to calendar', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default async function GuestBookingCalendar({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string }> }) {
    const { id } = await params; const { token = '' } = await searchParams;
    if (!token) notFound();
    const booking = await prisma.bookingReservation.findUnique({ where: { id } });
    if (!booking || !canAddBookingToCalendar(booking) || !validBookingCalendarToken(booking, token, process.env.AUTH_SECRET)) notFound();
    const time = new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Sofia' });
    return <main className="min-h-screen bg-background px-4 pb-20 pt-28 text-foreground"><div className="mx-auto max-w-3xl space-y-6"><header><p className="text-xs text-muted-foreground">NecrotixLab / Appointment</p><h1 className="mt-3 text-3xl font-bold tracking-tight">{booking.title}</h1><p className="mt-3 text-sm text-muted-foreground">{time.format(booking.startTime)} - {time.format(booking.endTime)} · Europe/Sofia</p></header><CalendarActions event={booking} downloadHref={`/api/booking/calendar/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`} /></div></main>;
}
