import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { BOOKING_CONFIG_SLUG, normalizeBookingConfig } from '../../Addons/Booking/settings';
import { localParts } from '../../Addons/Booking/availability';
test('native booking accepts required contact details without an external provider', async ({ page }) => {
    const prisma = new PrismaClient(); const email = `booking-${randomUUID()}@example.invalid`;
    const previous = await prisma.page.findUnique({ where: { slug: BOOKING_CONFIG_SLUG } });
    const config = normalizeBookingConfig({ installed: true, active: true, leadHours: 0, weekdays: [0, 1, 2, 3, 4, 5, 6], services: [{ title: 'CI native consultation', duration: 30, platform: 'PHONE' }] });
    try {
        await prisma.page.upsert({ where: { slug: BOOKING_CONFIG_SLUG }, create: { slug: BOOKING_CONFIG_SLUG, title: 'CI Booking', status: 'DRAFT', content: config }, update: { content: config } });
        await page.goto('/booking', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('iframe')).toHaveCount(0);
        await page.getByRole('button', { name: 'English', exact: true }).click();
        await page.getByRole('button', { name: /CI native consultation/ }).click();
        await page.locator('input[type=date]').fill(localParts(new Date(Date.now() + 3 * 86400000), config.timeZone).date);
        const slot = page.getByRole('button', { name: /09:00/ }).first(); await expect(slot).toBeVisible(); await slot.click();
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await page.locator('[name=firstName]').fill('Native'); await page.locator('[name=lastName]').fill('Test');
        await page.locator('[name=email]').fill(email); await page.locator('[name=phone]').fill('+359888123456');
        await page.getByRole('button', { name: 'Review appointment', exact: true }).click();
        await expect(page.getByText(email, { exact: true })).toBeVisible();
        const saved = page.waitForResponse(response => response.url().endsWith('/api/booking/reservations') && response.request().method() === 'POST');
        await page.getByRole('button', { name: /Book appointment/ }).click();
        const response = await saved; expect(response.status(), await response.text()).toBe(201);
        await expect(page.getByRole('status')).toContainText('Request received');
        const booking = await prisma.bookingReservation.findFirstOrThrow({ where: { email } });
        expect(booking.source).toBe('NATIVE'); expect(booking.status).toBe('PENDING'); expect(booking.phone).toBe('+359888123456');
        expect(await prisma.bookingNotification.count({ where: { reservationId: booking.id } })).toBe(1);
    } finally {
        await prisma.bookingReservation.deleteMany({ where: { email } });
        if (previous) await prisma.page.update({ where: { slug: BOOKING_CONFIG_SLUG }, data: { content: previous.content ?? {} } });
        else await prisma.page.deleteMany({ where: { slug: BOOKING_CONFIG_SLUG } });
        await prisma.$disconnect();
    }
});
