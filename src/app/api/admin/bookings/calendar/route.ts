import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { bookingCalendarCollection } from '@addons/Booking/calendar';
export const runtime = 'nodejs';
async function download(scope: string, ids: string[]) {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) return new Response('Forbidden', { status: 403 });
    const all = scope === 'all';
    if (!all && (!ids.length || ids.length > 200 || ids.some(id => id.length > 160))) return new Response('Select between 1 and 200 bookings', { status: 400 });
    const items = await prisma.bookingReservation.findMany({ where: { status: 'CONFIRMED', startTime: { gte: new Date() }, ...(!all ? { id: { in: ids } } : {}) }, orderBy: { startTime: 'asc' }, take: 201 });
    if (items.length > 200) return new Response('More than 200 bookings; use individual selection', { status: 413 });
    if (!items.length) return new Response('No confirmed upcoming bookings selected', { status: 404 });
    return new Response(bookingCalendarCollection(items), { headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': 'attachment; filename="necrotixlab-bookings.ics"', 'cache-control': 'private, no-store', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex, nofollow' } });
}
export async function GET(request: Request) {
    const query = new URL(request.url).searchParams;
    return download(query.get('scope') || '', [...new Set(query.getAll('ids'))]);
}
export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) return new Response('Forbidden', { status: 403 });
    // No mutation: only an authenticated administrator can download calendar data.
    if (Number(request.headers.get('content-length')) > 40000) return new Response('Too large', { status: 413 });
    const form = await request.formData();
    return download(String(form.get('scope') || ''), [...new Set(form.getAll('ids').map(String))]);
}
