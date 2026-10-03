import { purgeExpiredBookings } from '@addons/Booking/retention';
import { validBookingCronAuthorization } from '@addons/Booking/webhook';
export const runtime = 'nodejs';
export async function POST(request: Request) {
    if (!validBookingCronAuthorization(request.headers.get('authorization'), process.env.BOOKING_CRON_SECRET)) return new Response('Unauthorized', { status: 401 });
    return Response.json({ deleted: await purgeExpiredBookings() }, { headers: { 'cache-control': 'no-store' } });
}
