import 'server-only';
import { prisma } from '@/lib/prisma';
import { BOOKING_CONFIG_SLUG, bookingReady, calOrigin, normalizeBookingConfig } from './settings';
export async function bookingAddonConfig() {
    const record = await prisma.page.findUnique({ where: { slug: BOOKING_CONFIG_SLUG }, select: { content: true } }).catch(() => null);
    return normalizeBookingConfig(record?.content);
}
export async function bookingAddonReady() {
    return bookingReady(await bookingAddonConfig(), calOrigin(process.env.CALDIY_ORIGIN));
}
