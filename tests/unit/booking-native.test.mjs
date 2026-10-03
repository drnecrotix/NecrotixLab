import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { normalizeBookingConfig, bookingReady, BOOKING_CONFIG_SLUG } from '../../Addons/Booking/settings.ts';
import { availableSlots, localParts, localDateTime, overlaps } from '../../Addons/Booking/availability.ts';
const now = new Date('2026-10-05T05:00:00Z');
const config = normalizeBookingConfig({ installed: true, active: true, services: [{ title: 'Consultation', duration: 30 }], leadHours: 0, bufferMinutes: 15 });
test('native services and readiness need no Cal origin or event path', () => {
    assert.equal(bookingReady(config), true); assert.equal(config.services[0].path, ''); assert.equal(config.approvalRequired, true);
    assert.equal(bookingReady(normalizeBookingConfig({ ...config, weekdays: [] })), false);
    const ids = normalizeBookingConfig({ services: [{ title: 'Existing', id: 'service-1' }, { title: 'New', id: 'service-1' }] }).services.map(item => item.id);
    assert.equal(new Set(ids).size, 2);
});
test('availability applies working hours, notice, buffers, days and horizon', () => {
    const slots = availableSlots(config, 30, '2026-10-05', [], now);
    assert.equal(slots[0], '2026-10-05T06:00:00.000Z'); assert.equal(slots.at(-1), '2026-10-05T13:30:00.000Z');
    const busy = [{ startTime: new Date('2026-10-05T06:00:00Z'), endTime: new Date('2026-10-05T06:30:00Z') }];
    const filtered = availableSlots(config, 30, '2026-10-05', busy, now);
    assert.equal(filtered[0], '2026-10-05T06:45:00.000Z');
    assert.deepEqual(availableSlots(config, 30, '2026-10-04', [], now), []);
    assert.deepEqual(availableSlots({ ...config, blockedDates: ['2026-10-05'] }, 30, '2026-10-05', [], now), []);
    assert.deepEqual(availableSlots(config, 30, '2027-10-05', [], now), []);
    assert.deepEqual(availableSlots(config, 30, '2026-02-30', [], now), []);
    assert.ok(availableSlots({ ...config, leadHours: 3 }, 30, '2026-10-05', [], now).every(value => +new Date(value) >= +now + 10800000));
});
test('Sofia DST gaps and repeated wall times are safe', () => {
    assert.equal(localDateTime('2026-03-29T03:30', 'Europe/Sofia'), null);
    assert.equal(localDateTime('2026-10-25T03:30', 'Europe/Sofia'), null);
    assert.equal(localDateTime('2026-10-26T09:00', 'Europe/Sofia').toISOString(), '2026-10-26T07:00:00.000Z');
    assert.equal(localParts(new Date('2026-10-25T07:00:00Z'), 'Europe/Sofia').time, '09:00');
});
test('touching boundaries respect configured buffers', () => {
    const busy = [{ startTime: new Date('2026-10-05T06:00Z'), endTime: new Date('2026-10-05T06:30Z') }];
    assert.equal(overlaps(new Date('2026-10-05T06:30Z'), new Date('2026-10-05T07:00Z'), busy, 0), false);
    assert.equal(overlaps(new Date('2026-10-05T06:30Z'), new Date('2026-10-05T07:00Z'), busy, 15), true);
});
function fixture() {
    const records = []; const rates = new Map(); const jobs = []; let locked = false; let tail = Promise.resolve();
    const tomorrow = new Date(Date.now() + 3 * 86400000); const day = localParts(tomorrow, 'Europe/Sofia').date;
    const settings = normalizeBookingConfig({ ...config, weekdays: [0, 1, 2, 3, 4, 5, 6], horizonDays: 20 });
    const start = new Date(availableSlots(settings, 30, day, [])[0]);
    const tx = {
        $executeRaw: async () => { locked = true; }, page: { findUnique: async () => ({ content: settings }) },
        bookingRateLimit: { deleteMany: async () => ({}), upsert: async ({ where }) => { const count = (rates.get(where.key) || 0) + 1; rates.set(where.key, count); return { count }; } },
        bookingReservation: {
            findUnique: async ({ where }) => records.find(item => item.calUid === where.calUid),
            findUniqueOrThrow: async ({ where }) => { const item = records.find(item => item.id === where.id); if (!item) throw Error('Missing'); return item; },
            findMany: async ({ where }) => records.filter(item => item.id !== where.id?.not && ['PENDING', 'CONFIRMED'].includes(item.status) && item.startTime < where.startTime.lt && item.endTime > where.endTime.gt),
            create: async ({ data }) => { assert.equal(locked, true); const row = { id: `id-${records.length}`, ...data }; records.push(row); return row; },
            update: async ({ where, data }) => { const row = records.find(item => item.id === where.id); Object.assign(row, { ...data, calendarSequence: row.calendarSequence + 1 }); return row; },
        },
    };
    const prisma = { $transaction: callback => { const result = tail.then(async () => { locked = false; return callback(tx); }); tail = result.catch(() => {}); return result; } };
    const source = readFileSync(new URL('../../Addons/Booking/native.ts', import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const deps = { 'server-only': {}, 'node:crypto': { createHash: () => ({ update: value => ({ digest: () => value }) }) }, '@/lib/prisma': { prisma }, './settings': { normalizeBookingConfig, bookingReady, BOOKING_CONFIG_SLUG }, './availability': { availableSlots, localParts, overlaps }, './workflows': { synchronizeBookingWorkflows: async () => {} }, './notifications': { queueBookingNotifications: async (_, row) => jobs.push(row.id) } };
    const loaded = { exports: {} }; new Function('exports', 'require', compiled)(loaded.exports, name => deps[name]);
    return { ...loaded.exports, records, jobs, start, settings };
}
const contact = { firstName: 'Nikola', lastName: 'Stoyanov', email: 'n@example.com', phone: '+359888123456' };
test('concurrent native requests cannot occupy the same time; retries are idempotent', async () => {
    const f = fixture(); const results = await Promise.allSettled([f.createNativeBooking(f.settings, contact, 'service-0', f.start, 'first', 'ip'), f.createNativeBooking(f.settings, contact, 'service-0', f.start, 'second', 'ip')]);
    assert.equal(results.filter(item => item.status === 'fulfilled').length, 1); assert.equal(f.records.length, 1); assert.equal(f.records[0].status, 'PENDING');
    const repeat = await f.createNativeBooking(f.settings, contact, 'service-0', f.start, 'first', 'ip'); assert.equal(repeat.id, f.records[0].id); assert.equal(f.jobs.length, 1);
    await assert.rejects(f.createNativeBooking(f.settings, { ...contact, email: 'other@example.com' }, 'service-0', f.start, 'first', 'ip'));
});
test('admin transitions queue updates, preserve reschedule status and release declined time', async () => {
    const f = fixture(); const row = await f.createNativeBooking(f.settings, contact, 'service-0', f.start, 'first', 'ip');
    await f.manageNativeBooking(f.settings, row.id, 'approve', null, 'https://meet.google.com/test', 'Join'); assert.equal(row.status, 'CONFIRMED');
    const next = new Date(+f.start + 3600000); await f.manageNativeBooking(f.settings, row.id, 'reschedule', next, '', 'Phone'); assert.equal(+row.startTime, +next); assert.ok(row.rescheduledAt);
    await f.manageNativeBooking(f.settings, row.id, 'decline', null, '', ''); assert.equal(row.status, 'REJECTED');
    await assert.rejects(f.manageNativeBooking(f.settings, row.id, 'approve', null, '', ''));
    await f.createNativeBooking(f.settings, contact, 'service-0', next, 'second', 'ip'); assert.equal(f.records.length, 2);
});
test('legacy records cannot be mutated by native admin operations', async () => {
    const f = fixture(); const row = await f.createNativeBooking(f.settings, contact, 'service-0', f.start, 'first', 'ip'); row.source = 'CALDIY';
    await assert.rejects(f.manageNativeBooking(f.settings, row.id, 'decline', null, '', ''), /Legacy/);
});
test('persistent per-IP request cap rejects a sixth distinct booking', async () => {
    const f = fixture();
    for (let i = 0; i < 5; i++) await f.createNativeBooking(f.settings, { ...contact, email: `n${i}@example.com` }, 'service-0', new Date(+f.start + i * 3600000), `request-${i}`, 'same-ip');
    await assert.rejects(f.createNativeBooking(f.settings, { ...contact, email: 'six@example.com' }, 'service-0', new Date(+f.start + 5 * 3600000), 'six', 'same-ip'), /Too many requests/);
    assert.equal(f.records.length, 5);
});
