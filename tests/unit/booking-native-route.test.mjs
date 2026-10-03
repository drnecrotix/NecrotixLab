import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { normalizeBookingConfig, bookingReady } from '../../Addons/Booking/settings.ts';
import { bookingSameOrigin } from '../../Addons/Booking/request-policy.ts';
import { normalizeBookingContact } from '../../Addons/Booking/intake.ts';
function fixture(active = true) {
    const calls = []; const callbacks = []; class BookingConflict extends Error {}
    const deps = { '@addons/Booking/request-policy': { bookingSameOrigin }, 'next/server': { after: cb => callbacks.push(cb) }, '@addons/Booking/server': { bookingAddonConfig: async () => normalizeBookingConfig({ installed: true, active, services: [{ title: 'Consultation' }] }) }, '@addons/Booking/settings': { bookingReady }, '@addons/Booking/intake': { normalizeBookingContact }, '@addons/Booking/native': { BookingConflict, createNativeBooking: async (...args) => { calls.push(args); return { id: 'private-id', email: 'private@example.com', status: 'PENDING', startTime: args[3], endTime: new Date(+args[3] + 1800000), timeZone: 'Europe/Sofia', title: 'Consultation' }; } }, '@addons/Booking/notifications': { processBookingNotifications: async () => {} } };
    const source = readFileSync(new URL('../../src/app/api/booking/reservations/route.ts', import.meta.url), 'utf8'); const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const loaded = { exports: {} }; new Function('exports', 'require', compiled)(loaded.exports, name => deps[name]); return { ...loaded.exports, calls, callbacks };
}
const payload = { firstName: 'Nikola', lastName: 'Stoyanov', email: 'n@example.com', phone: '+359888123456', serviceId: 'service-0', startTime: '2026-11-01T09:00:00Z', requestId: '550e8400-e29b-41d4-a716-446655440000' };
const request = (body = payload, origin = 'https://example.com') => new Request('https://example.com/api/booking/reservations', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) });
test('native booking submissions require same origin and bounded JSON', async () => {
    const f = fixture(); assert.equal((await f.POST(request(payload, 'https://evil.example'))).status, 403);
    assert.equal((await f.POST(request({ ...payload, firstName: 'x'.repeat(5000) }))).status, 413);
    assert.equal(f.calls.length, 0);
});
test('server requires both names, email, international phone and a valid request ID', async () => {
    for (const replacement of [{ firstName: '' }, { lastName: '' }, { email: 'invalid' }, { phone: '0888' }, { requestId: 'bad' }, { startTime: 'invalid' }, { phone: 42 }]) {
        const f = fixture(); assert.equal((await f.POST(request({ ...payload, ...replacement }))).status, 400); assert.equal(f.calls.length, 0);
    }
});
test('inactive addon blocks public reservation writes', async () => {
    const f = fixture(false); assert.equal((await f.POST(request())).status, 503); assert.equal(f.calls.length, 0);
});
test('success returns no stored personal data and schedules durable email delivery', async () => {
    const f = fixture(); const response = await f.POST(request()); assert.equal(response.status, 201); const result = await response.json();
    assert.equal(result.status, 'PENDING'); assert.equal(result.email, undefined); assert.equal(result.id, undefined); assert.equal(f.calls.length, 1); assert.equal(f.callbacks.length, 1); assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('browser-facing host survives Next internal URL rewriting and proxy TLS', async () => {
    const f = fixture();
    const req = new Request('http://localhost:3000/api/booking/reservations', { method: 'POST', headers: { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000', 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    assert.equal((await f.POST(req)).status, 201);
    assert.equal(bookingSameOrigin(new Request('http://localhost/api', { headers: { host: 'necrotixlab.com', origin: 'https://necrotixlab.com', 'x-forwarded-proto': 'https' } })), true);
    for (const origin of ['https://evil.example', 'http://necrotixlab.com', 'https://necrotixlab.com:444', 'https://user@necrotixlab.com', 'null']) assert.equal(bookingSameOrigin(new Request('http://localhost/api', { headers: { host: 'necrotixlab.com', origin, 'x-forwarded-proto': 'https' } })), false);
});
