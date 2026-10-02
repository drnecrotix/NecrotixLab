import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { bookingCalendarIcs, canAddBookingToCalendar } from '@addons/Booking/calendar';
import { validBookingCalendarToken } from '@addons/Booking/calendar-access';
export const runtime = 'nodejs';
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const token = new URL(request.url).searchParams.get('token') || '';
    const session = token ? null : await auth();
    const admin = Boolean(session?.user && ['OWNER', 'ADMIN'].includes(session.user.role));
    if (!admin && !token) return new Response('Not found', { status: 404 });
    const booking = await prisma.bookingReservation.findUnique({ where: { id } });
    if (!booking || !canAddBookingToCalendar(booking) || (!admin && !validBookingCalendarToken(booking, token, process.env.AUTH_SECRET))) return new Response('Not found', { status: 404 });
    return new Response(bookingCalendarIcs(booking), { headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': 'attachment; filename="necrotixlab-appointment.ics"', 'cache-control': 'private, no-store', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex, nofollow' } });
}
