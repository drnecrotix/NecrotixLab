import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../../Addons/Booking/dashboard.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function fixture({ role = 'OWNER', installed = true, active = true, failure = false } = {}) {
    const calls = [];
    let configReads = 0;
    const prisma = { bookingReservation: {
        count(args) { calls.push(args); return Promise.resolve(args.where.status === 'PENDING' ? 3 : 2); },
        findMany(args) { calls.push(args); return Promise.resolve([{ id: 'latest', status: 'PENDING' }]); },
    }, async $transaction(queries) { if (failure) throw new Error('Database unavailable'); return Promise.all(queries); } };
    const dependencies = { 'server-only': {}, '@/lib/prisma': { prisma }, './server': { async bookingAddonConfig() { configReads++; return { installed, active }; } } };
    const loaded = { exports: {} };
    new Function('exports', 'require', compiled)(loaded.exports, name => dependencies[name]);
    const now = new Date('2026-10-03T05:00:00Z');
    return { run: () => loaded.exports.bookingDashboardOverview(role, now), calls, configReads: () => configReads, now };
}
test('booking overview does not read config or reservations for unauthorized roles', async () => {
    for (const role of [undefined, 'EDITOR', 'USER']) {
        const f = fixture({ role: role === undefined ? '' : role });
        assert.equal(await f.run(), null); assert.equal(f.configReads(), 0); assert.equal(f.calls.length, 0);
    }
});
test('inactive or uninstalled booking skips reservation queries', async () => {
    for (const config of [{ active: false }, { installed: false }]) {
        const f = fixture(config); assert.equal(await f.run(), null); assert.equal(f.calls.length, 0);
    }
});
test('active booking summarizes pending and future confirmed records with bounded recent selection', async () => {
    for (const role of ['OWNER', 'ADMIN']) {
        const f = fixture({ role }); const result = await f.run();
        assert.equal(result.pending, 3); assert.equal(result.upcoming, 2); assert.equal(result.recent.length, 1);
        assert.deepEqual(f.calls[0].where, { status: 'PENDING' });
        assert.deepEqual(f.calls[1].where, { status: 'CONFIRMED', startTime: { gte: f.now } });
        assert.equal(f.calls[2].take, 5); assert.equal(f.calls[2].select.email, undefined);
        assert.deepEqual(f.calls[2].orderBy, [{ createdAt: 'desc' }, { id: 'desc' }]);
    }
});
test('failed reservation queries return unavailable rather than empty or zero counts', async () => {
    assert.deepEqual(await fixture({ failure: true }).run(), { available: false });
});
