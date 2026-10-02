import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { reminderMessageTime } from '../../Addons/Booking/workflow-policy.ts';
import { validBookingCronAuthorization } from '../../Addons/Booking/webhook.ts';
const source = readFileSync(new URL('../../src/app/api/booking/reminders/route.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
const secret = 'test-only-booking-cron-secret-123456789';
function fixture({ status = 'CONFIRMED', attempts = 0, fail = false, active = true } = {}) {
    let deliveries = 0;
    const state = { id: 'job', status: 'PENDING', attempts, hours: 24, dueAt: new Date(Date.now() - 10000), startTime: new Date(Date.now() + 3600000), reservation: { status, startTime: new Date(Date.now() + 3600000), customerName: 'Test', email: 'test@example.com', timeZone: 'invalid-zone', title: 'Consultation' } };
    state.reservation.startTime = state.startTime;
    const prisma = { bookingReminder: {
        async findMany() { return [{ ...state }]; },
        async findUnique() { return { ...state }; },
        async updateMany({ where, data }) {
            if (!where.id) return { count: 0 }; // no expired leases in this fixture
            if (typeof where.attempts === 'number' && where.attempts !== state.attempts) return { count: 0 };
            if (where.OR && state.status !== 'PENDING') return { count: 0 };
            if (where.status && where.status !== state.status) return { count: 0 };
            Object.assign(state, { ...data, ...(data.attempts ? { attempts: state.attempts + data.attempts.increment } : {}) }); return { count: 1 };
        },
    } };
    const transport = { async sendMail() { deliveries++; if (fail) throw new Error('SMTP failed'); }, close() {} };
    const dependencies = {
        nodemailer: { createTransport: () => transport },
        '@/lib/prisma': { prisma },
        '@/lib/integration-runtime': { getRuntimeSmtpConfig: async () => ({ user: 'test@example.com', password: 'test' }) },
        '@addons/Booking/server': { bookingAddonConfig: async () => ({ installed: true, active, reminderHours: 24 }) },
        '@addons/Booking/workflow-policy': { reminderMessageTime },
        '@addons/Booking/webhook': { validBookingCronAuthorization },
    };
    const loaded = { exports: {} };
    new Function('exports', 'require', compiled)(loaded.exports, name => { assert.ok(name in dependencies, `Unexpected dependency ${name}`); return dependencies[name]; });
    return { POST: loaded.exports.POST, state, deliveries: () => deliveries };
}
async function withSecret(callback) {
    const previous = process.env.BOOKING_CRON_SECRET; process.env.BOOKING_CRON_SECRET = secret;
    try { await callback(); } finally { if (previous === undefined) delete process.env.BOOKING_CRON_SECRET; else process.env.BOOKING_CRON_SECRET = previous; }
}
const request = () => new Request('https://example.com/api/booking/reminders', { method: 'POST', headers: { authorization: `Bearer ${secret}` } });
test('overlapping worker requests cannot claim the same pending job twice', () => withSecret(async () => {
    const f = fixture(); await Promise.all([f.POST(request()), f.POST(request())]);
    assert.equal(f.deliveries(), 1); assert.equal(f.state.status, 'SENT'); assert.equal(f.state.attempts, 1);
}));
test('cancelled reservations invalidate due reminders without sending', () => withSecret(async () => {
    const f = fixture({ status: 'CANCELLED' }); await f.POST(request());
    assert.equal(f.deliveries(), 0); assert.equal(f.state.status, 'CANCELLED');
}));
test('SMTP failures retry with delay and become failed on the third attempt', () => withSecret(async () => {
    const first = fixture({ fail: true }); await first.POST(request());
    assert.equal(first.state.status, 'PENDING'); assert.ok(first.state.dueAt > new Date());
    const third = fixture({ fail: true, attempts: 2 }); await third.POST(request());
    assert.equal(third.state.status, 'FAILED'); assert.equal(third.state.attempts, 3);
}));
test('unauthorized and inactive requests do not deliver messages', () => withSecret(async () => {
    const f = fixture(); const response = await f.POST(new Request('https://example.com', { method: 'POST' }));
    assert.equal(response.status, 401); assert.equal(f.deliveries(), 0);
    const disabled = fixture({ active: false }); assert.equal((await disabled.POST(request())).status, 200); assert.equal(disabled.deliveries(), 0);
}));
