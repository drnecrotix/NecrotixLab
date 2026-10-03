import { BookingStatusBadge } from './BookingStatusBadge';
import Link from 'next/link';
import { bookingDashboardOverview } from '@addons/Booking/dashboard';

export async function BookingRequestsPanel({ role }: { role: string | undefined }) {
    const overview = await bookingDashboardOverview(role);
    if (!overview) return null;
    const time = new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Sofia' });
    return (
        <section aria-labelledby="booking-overview-title" className="admin-dashboard-enter rounded-2xl border border-border bg-card p-5 sm:p-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 id="booking-overview-title" className="text-lg font-semibold">Booking requests</h2><p className="mt-1 text-xs text-muted-foreground">Latest synchronized requests and appointments. Times in Europe/Sofia.</p></div>
                <Link href="/admin/bookings" className="min-h-11 rounded-lg border border-border px-4 py-3 text-xs font-semibold hover:bg-muted">View reservations</Link>
            </header>
            {!overview.available ? <p role="status" className="mt-4 rounded-lg border border-amber-500/30 p-3 text-sm">Booking information is temporarily unavailable. Check Site Health and the booking database migrations.</p> : <>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Link href="/admin/bookings?view=unconfirmed" className="rounded-xl border border-border p-4 hover:bg-muted"><span className="text-xs text-muted-foreground">Awaiting approval</span><strong className="mt-2 block text-2xl tabular-nums">{overview.pending}</strong></Link>
                    <Link href="/admin/bookings?view=upcoming&status=ACTIVE" className="rounded-xl border border-border p-4 hover:bg-muted"><span className="text-xs text-muted-foreground">Upcoming confirmed appointments</span><strong className="mt-2 block text-2xl tabular-nums">{overview.upcoming}</strong></Link>
                </div>
                <h3 className="mt-5 text-sm font-semibold">Latest requests</h3>
                <ul className="mt-2 divide-y divide-border">{overview.recent.map(item => <li key={item.id}><Link href={`/admin/bookings/${encodeURIComponent(item.id)}`} className="flex min-h-16 flex-wrap items-center justify-between gap-3 rounded-lg py-3 hover:bg-muted/40"><div className="min-w-0"><p className="break-words text-sm font-semibold">{item.title}</p><p className="mt-1 break-words text-xs text-muted-foreground">{item.customerName || 'Unnamed attendee'} - {time.format(item.startTime)}</p></div><BookingStatusBadge booking={item} /></Link></li>)}</ul>
                {overview.recent.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No recorded requests yet. New reservations appear after signed Cal.diy webhook delivery.</p>}
            </>}
            <p className="mt-4 text-xs text-muted-foreground">Approve, reject, cancel or reschedule in Cal.diy. Changes appear here after synchronization.</p>
        </section>
    );
}
