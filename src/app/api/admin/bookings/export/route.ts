import { bookingMonthRange } from '@addons/Booking/calendar-view';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { bookingDataCsv } from '@addons/Booking/export.mjs';
import { bookingStatusFilter } from '@addons/Booking/status.mjs';
export const runtime = 'nodejs';
async function exportData(query: URLSearchParams) {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) return new Response('Forbidden', { status: 403 });
    const scope = query.get('scope') || 'filtered'; const ids = [...new Set(query.getAll('ids'))];
    if (!['all', 'filtered', 'selected'].includes(scope)) return new Response('Invalid export scope', { status: 400 });
    if (scope === 'selected' && (!ids.length || ids.length > 200 || ids.some(id => id.length > 160))) return new Response('Select between 1 and 200 bookings', { status: 400 });
    const q = (query.get('q') || '').trim().slice(0, 120); const view = query.get('view'); const range = view === 'calendar' ? bookingMonthRange(query.get('month') || '') : null;
    if (scope === 'filtered' && view === 'calendar' && !range) return new Response('Invalid calendar month', { status: 400 });
    const now = new Date();
    const where = scope === 'selected' ? { id: { in: ids } } : scope === 'all' ? {} : { AND: [
        bookingStatusFilter(view === 'unconfirmed' ? 'PENDING' : query.get('status') || undefined), ...(range ? [{ startTime: range }] : []),
        ...(view === 'upcoming' ? [{ startTime: { gte: now } }] : view === 'past' ? [{ startTime: { lt: now } }] : []),
        ...(q ? [{ OR: [{ customerName: { contains: q, mode: 'insensitive' as const } }, { email: { contains: q, mode: 'insensitive' as const } }, { title: { contains: q, mode: 'insensitive' as const } }] }] : []),
    ] };
    const bookings = await prisma.bookingReservation.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], take: 5001 });
    if (bookings.length > 5000) return new Response('More than 5000 records; narrow your filters', { status: 413 });
    return new Response(bookingDataCsv(bookings), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="necrotixlab-bookings.csv"', 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex, nofollow' } });
}
export async function GET(request: Request) { return exportData(new URL(request.url).searchParams); }
export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) return new Response('Forbidden', { status: 403 });
    if (Number(request.headers.get('content-length')) > 40000) return new Response('Too large', { status: 413 });
    const form = await request.formData(); const query = new URLSearchParams();
    for (const [key, value] of form) if (typeof value === 'string') query.append(key, value);
    return exportData(query);
}
