import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { bookingCalendarCollection } from '../../Addons/Booking/calendar.ts';
const source = readFileSync(new URL('../../src/app/api/admin/bookings/calendar/route.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function fixture(role, count = 1) {
    const calls = []; const item = { id: 'one', title: 'Consultation', status: 'CONFIRMED', startTime: new Date(Date.now() + 86400000), endTime: new Date(Date.now() + 88200000), eventAt: new Date() };
    const dependencies = { '@/auth': { auth: async () => role ? { user: { role } } : null }, '@/lib/prisma': { prisma: { bookingReservation: { findMany: async args => { calls.push(args); return Array(count).fill(item); } } } }, '@addons/Booking/calendar': { bookingCalendarCollection } };
    const loaded = { exports: {} }; new Function('exports', 'require', compiled)(loaded.exports, name => dependencies[name]);
    return { ...loaded.exports, calls };
}
test('bulk calendar exports require OWNER/ADMIN before reading records', async () => {
    for (const role of [null, 'EDITOR']) { const f = fixture(role); assert.equal((await f.GET(new Request('https://example.com/api/admin/bookings/calendar?scope=all'))).status, 403); assert.equal(f.calls.length, 0); }
});
test('all exports bound queries and include only upcoming confirmed events', async () => {
    const f = fixture('OWNER', 2); const result = await f.GET(new Request('https://example.com/api/admin/bookings/calendar?scope=all'));
    assert.equal(result.status, 200); assert.equal(f.calls[0].take, 201); assert.equal(f.calls[0].where.status, 'CONFIRMED'); assert.ok(f.calls[0].where.startTime.gte instanceof Date); assert.equal(result.headers.get('cache-control'), 'private, no-store');
    assert.equal((await result.text()).match(/BEGIN:VEVENT/g).length, 2);
    assert.equal((await fixture('ADMIN', 201).GET(new Request('https://example.com/api/admin/bookings/calendar?scope=all'))).status, 413);
});
test('selected POST exports validate and deduplicate IDs without mutating reservations', async () => {
    const f = fixture('ADMIN'); const form = new FormData(); form.set('scope', 'selected'); form.append('ids', 'one'); form.append('ids', 'one');
    assert.equal((await f.POST(new Request('https://example.com/api/admin/bookings/calendar', { method: 'POST', body: form }))).status, 200);
    assert.deepEqual(f.calls[0].where.id.in, ['one']);
    const empty = fixture('ADMIN'); assert.equal((await empty.GET(new Request('https://example.com/api/admin/bookings/calendar?scope=selected'))).status, 400); assert.equal(empty.calls.length, 0);
});
