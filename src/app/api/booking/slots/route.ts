import { bookingAddonConfig } from '@addons/Booking/server';
import { bookingReady } from '@addons/Booking/settings';
import { nativeSlots } from '@addons/Booking/native';
import { localParts } from '@addons/Booking/availability';
export const runtime = 'nodejs';
export async function GET(request: Request) {
    const config = await bookingAddonConfig();
    if (!bookingReady(config)) return Response.json({ error: 'Booking unavailable' }, { status: 503 });
    const query = new URL(request.url).searchParams; const day = query.get('date') || ''; const service = query.get('service') || '';
    const now = new Date();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < localParts(now, config.timeZone).date || day > localParts(new Date(+now + config.horizonDays * 86400000), config.timeZone).date || !config.services.some(item => item.id === service)) return Response.json({ error: 'Invalid date or service' }, { status: 400 });
    return Response.json({ slots: await nativeSlots(config, service, day), timeZone: config.timeZone }, { headers: { 'cache-control': 'no-store' } });
}
