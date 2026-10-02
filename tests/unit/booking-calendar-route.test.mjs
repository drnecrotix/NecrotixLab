import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { bookingCalendarIcs, canAddBookingToCalendar } from '../../Addons/Booking/calendar.ts';
import { bookingCalendarToken, validBookingCalendarToken } from '../../Addons/Booking/calendar-access.ts';
const source = readFileSync(new URL('../../src/app/api/booking/calendar/[id]/route.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const event = { id: 'test', title: 'Consultation', email: 'private@example.com', status: 'CONFIRMED', startTime: new Date(Date.now() + 86400000), endTime: new Date(Date.now() + 86400000 + 1800000), eventAt: new Date() };
function fixture(role, status = 'CONFIRMED') {
    const dependencies = { '@/auth': { auth: async () => role ? { user: { role } } : null }, '@/lib/prisma': { prisma: { bookingReservation: { findUnique: async () => ({ ...event, status }) } } }, '@addons/Booking/calendar': { bookingCalendarIcs, canAddBookingToCalendar }, '@addons/Booking/calendar-access': { validBookingCalendarToken } };
    const loaded = { exports: {} };
    new Function('exports', 'require', compiled)(loaded.exports, name => dependencies[name]);
    return url => loaded.exports.GET(new Request(url), { params: Promise.resolve({ id: 'test' }) });
}
test('calendar download requires an administrator or a valid booking-specific token', async () => {
    const url = 'https://example.com/api/booking/calendar/test';
    assert.equal((await fixture(null)(url)).status, 404);
    assert.equal((await fixture('EDITOR')(url)).status, 404);
    assert.equal((await fixture(null)(url + '?token=wrong')).status, 404);
    const admin = await fixture('ADMIN')(url);
    assert.equal(admin.status, 200); assert.equal(admin.headers.get('cache-control'), 'private, no-store');
    assert.equal(admin.headers.get('content-type'), 'text/calendar; charset=utf-8');
    assert.ok(!(await admin.text()).includes(event.email));
});
test('signed guests can download confirmed events but not cancelled or pending bookings', async () => {
    const previous = process.env.AUTH_SECRET;
    process.env.AUTH_SECRET = 'test-only-calendar-route-secret-0123456789';
    try {
        const token = bookingCalendarToken(event, process.env.AUTH_SECRET);
        const url = `https://example.com/api/booking/calendar/test?token=${token}`;
        assert.equal((await fixture(null)(url)).status, 200);
        assert.equal((await fixture(null, 'CANCELLED')(url)).status, 404);
        assert.equal((await fixture('OWNER', 'PENDING')('https://example.com/api/booking/calendar/test')).status, 404);
    } finally { if (previous === undefined) delete process.env.AUTH_SECRET; else process.env.AUTH_SECRET = previous; }
});
