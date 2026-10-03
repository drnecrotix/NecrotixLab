import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { bookingDataCsv } from '../../Addons/Booking/export.mjs';
import { bookingStatusFilter } from '../../Addons/Booking/status.mjs';
const source = readFileSync(new URL('../../src/app/api/admin/bookings/export/route.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function fixture(role, count = 1) {
    const calls = []; const item = { id: 'one', title: 'Consultation', status: 'CONFIRMED', startTime: new Date(Date.now() + 86400000), endTime: new Date(Date.now() + 88200000), eventAt: new Date() };
    const dependencies = { '@/auth': { auth: async () => role ? { user: { role } } : null }, '@/lib/prisma': { prisma: { bookingReservation: { findMany: async args => { calls.push(args); return Array(count).fill(item); } } } }, '@addons/Booking/export.mjs': { bookingDataCsv }, '@addons/Booking/status.mjs': { bookingStatusFilter } };
    const loaded = { exports: {} }; new Function('exports', 'require', compiled)(loaded.exports, name => dependencies[name]);
    return { ...loaded.exports, calls };
}
test('CSV exports require OWNER/ADMIN before reading records', async () => {
    for (const role of [null, 'EDITOR']) { const f = fixture(role); assert.equal((await f.GET(new Request('https://example.com/api/admin/bookings/export?scope=all'))).status, 403); assert.equal(f.calls.length, 0); }
});
test('CSV queries are bounded and excessive exports fail without truncation', async () => {
    const f = fixture('OWNER', 2); const result = await f.GET(new Request('https://example.com/api/admin/bookings/export?scope=all'));
    assert.equal(result.status, 200); assert.equal(f.calls[0].take, 5001); assert.deepEqual(f.calls[0].where, {});
    assert.equal(result.headers.get('cache-control'), 'private, no-store'); assert.ok((await result.text()).includes('Consultation'));
    assert.equal((await fixture('ADMIN', 5001).GET(new Request('https://example.com/api/admin/bookings/export?scope=all'))).status, 413);
});
test('filtered CSV combines date, search and rescheduled filters', async () => {
    const f = fixture('ADMIN'); await f.GET(new Request('https://example.com/api/admin/bookings/export?scope=filtered&status=RESCHEDULED&view=upcoming&q=Customer'));
    const and = f.calls[0].where.AND; assert.ok(and[0].OR); assert.ok(and[1].startTime.gte instanceof Date); assert.equal(and[2].OR[0].customerName.contains, 'Customer');
});
test('selected POST exports validate and deduplicate IDs without mutating reservations', async () => {
    const f = fixture('ADMIN'); const form = new FormData(); form.set('scope', 'selected'); form.append('ids', 'one'); form.append('ids', 'one');
    assert.equal((await f.POST(new Request('https://example.com/api/admin/bookings/export', { method: 'POST', body: form }))).status, 200);
    assert.deepEqual(f.calls[0].where.id.in, ['one']);
    const empty = fixture('ADMIN'); assert.equal((await empty.GET(new Request('https://example.com/api/admin/bookings/export?scope=selected'))).status, 400); assert.equal(empty.calls.length, 0);
});
