import { bookingStatusCode, bookingStatusLabel } from '@addons/Booking/status.mjs';
type BookingStatus = { status: string; rescheduledAt?: Date | null; rescheduledFromUid?: string | null };
export function BookingStatusBadge({ booking }: { booking: BookingStatus }) {
    const code = bookingStatusCode(booking);
    const color = code === 'CONFIRMED' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
        : code === 'PENDING' ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
            : code === 'RESCHEDULED' ? 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                : code === 'DECLINED' ? 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300' : 'border-border text-muted-foreground';
    return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${color}`}>{bookingStatusLabel(booking)}</span>;
}
