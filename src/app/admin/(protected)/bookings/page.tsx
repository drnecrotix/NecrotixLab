import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { calOrigin } from '@addons/Booking/settings';
export const dynamic = 'force-dynamic';
const statuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED', 'RESCHEDULED', 'COMPLETED'];
export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
    const session = await auth(); if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) redirect('/admin');
    const params = await searchParams; const status = statuses.includes(params.status || '') ? params.status : undefined;
    const page = Math.min(10000, Math.max(1, Number.parseInt(params.page || '1', 10) || 1));
    const where = status ? { status } : {};
    const [items, total, pending] = await Promise.all([prisma.bookingReservation.findMany({ where, orderBy: { startTime: 'desc' }, take: 30, skip: (page - 1) * 30 }), prisma.bookingReservation.count({ where }), prisma.bookingReservation.count({ where: { status: 'PENDING' } })]);
    const origin = calOrigin(process.env.CALDIY_ORIGIN);
    const time = (value: Date) => new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Sofia' }).format(value);
    return <div className="mx-auto max-w-6xl space-y-6"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-xs text-muted-foreground">Booking addon</p><h1 className="mt-2 text-3xl font-black">Reservations</h1><p className="mt-3 text-sm text-muted-foreground">{total} matching reservations · {pending} awaiting approval · times in Europe/Sofia</p></div><div className="flex flex-wrap gap-4 text-sm"><Link href="/admin/addons/booking" className="underline">Settings</Link>{origin && <a href={`${origin}/bookings`} target="_blank" rel="noopener noreferrer" className="underline">Manage in Cal.diy</a>}</div></header>
        {!process.env.CALDIY_WEBHOOK_SECRET && <p role="status" className="rounded-xl border border-amber-500/30 p-4 text-sm">Configure CALDIY_WEBHOOK_SECRET and the Cal.diy webhook to record new reservations here.</p>}
        <nav aria-label="Reservation status" className="flex flex-wrap gap-2"><Link href="/admin/bookings" className="min-h-10 rounded-lg border border-border px-3 py-2 text-xs">All</Link>{statuses.map(item => <Link key={item} href={`/admin/bookings?status=${item}`} aria-current={status === item ? 'page' : undefined} className={`min-h-10 rounded-lg border px-3 py-2 text-xs ${status === item ? 'border-foreground bg-muted' : 'border-border'}`}>{item.toLowerCase()}</Link>)}</nav>
        <div className="space-y-4">{items.map(item => <article key={item.id} className="grid gap-5 rounded-xl border border-border p-5 md:grid-cols-[1fr_1fr]"><div><p className="text-xs font-semibold text-muted-foreground">{item.status}</p><h2 className="mt-2 text-lg font-bold">{item.title}</h2><p className="mt-3 text-sm">{time(item.startTime)} - {time(item.endTime)}</p><p className="mt-2 break-all font-mono text-[10px] text-muted-foreground">Cal.diy UID: {item.calUid}</p></div><div><h3 className="font-semibold">{item.customerName || 'No attendee name'}</h3><p className="mt-2 break-all text-sm">{item.email}</p><p className="mt-2 text-xs text-muted-foreground">Customer timezone: {item.timeZone || 'Not provided'}</p>{item.notes && <p className="mt-3 whitespace-pre-wrap break-words text-sm">{item.notes}</p>}{item.reason && <p className="mt-3 whitespace-pre-wrap text-xs text-muted-foreground">Reason: {item.reason}</p>}</div></article>)}{items.length === 0 && <p className="rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">No recorded reservations. Existing Cal.diy bookings are not imported automatically; records arrive through signed webhook events.</p>}</div>
        <div className="flex justify-between text-sm">{page > 1 && <Link href={`/admin/bookings?page=${page - 1}${status ? `&status=${status}` : ''}`} className="underline">Previous</Link>}{page * 30 < total && <Link href={`/admin/bookings?page=${page + 1}${status ? `&status=${status}` : ''}`} className="ml-auto underline">Next</Link>}</div>
        <p className="text-xs text-muted-foreground">This is a synchronized record. Approve, cancel or reschedule in Cal.diy; webhook delivery updates this list.</p>
    </div>;
}
