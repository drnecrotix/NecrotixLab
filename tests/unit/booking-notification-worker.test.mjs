import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingStatusLabel, bookingStatusCode } from '../../Addons/Booking/status.mjs';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { normalizeBookingConfig } from '../../Addons/Booking/settings.ts';
import { bookingNotificationText, calendarForRecipient, validBookingEmail } from '../../Addons/Booking/notification-policy.ts';
import { bookingCalendarInvitation } from '../../Addons/Booking/calendar.ts';
const source = readFileSync(new URL('../../Addons/Booking/notifications.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
function fixture({ active = true, fail = false, status = 'CONFIRMED' } = {}) {
    const jobs = []; const deliveries = [];
    const config = normalizeBookingConfig({ installed: true, active });
    const booking = { id: 'one', calendarUid: 'cal-event', calendarSequence: 1, calendarSelected: false, email: 'client@example.com', organizerEmail: 'host@example.com', customerName: 'Test Client', title: 'Consultation', category: 'Design', status, platform: 'ZOOM', meetingUrl: 'https://zoom.us/j/test', meetingInstructions: '', timeZone: 'Europe/Sofia', eventAt: new Date(), startTime: new Date(Date.now() + 86400000), endTime: new Date(Date.now() + 88200000) };
    function match(job, where) {
        for (const key of ['id', 'reservationId', 'recipientRole', 'fingerprint', 'calendarAttached']) if (key in where && job[key] !== where[key]) return false;
        if (where.eventAt?.not && +job.eventAt === +where.eventAt.not) return false;
        if (where.eventAt instanceof Date && +job.eventAt !== +where.eventAt) return false;
        if (typeof where.attempts === 'number' && job.attempts !== where.attempts) return false;
        if (where.attempts?.gte && job.attempts < where.attempts.gte) return false;
        if (where.status && (typeof where.status === 'string' ? job.status !== where.status : !where.status.in.includes(job.status))) return false;
        if (where.lockedUntil?.lt && !(job.lockedUntil < where.lockedUntil.lt)) return false;
        if (where.OR && !where.OR.some(condition => match(job, condition))) return false;
        return true;
    }
    const model = {
        async findFirst({ where }) { return jobs.find(job => match(job, where)) || null; },
        async upsert({ create }) { if (!jobs.some(job => job.reservationId === create.reservationId && +job.eventAt === +create.eventAt && job.kind === create.kind && job.recipientRole === create.recipientRole)) jobs.push({ ...create, id: `job-${jobs.length}`, status: 'PENDING', attempts: 0, dueAt: new Date(), lockedUntil: null }); },
        async findMany() { return jobs.filter(job => job.dueAt <= new Date() && job.attempts < 3 && (job.status === 'PENDING' || job.status === 'PROCESSING' && job.lockedUntil < new Date())).map(job => ({ ...job })); },
        async findUnique({ where }) { const job = jobs.find(item => item.id === where.id); return job ? { ...job, reservation: { ...booking } } : null; },
        async updateMany({ where, data }) { let count = 0; for (const job of jobs) if (match(job, where)) { const attempts = data.attempts ? job.attempts + data.attempts.increment : job.attempts; Object.assign(job, data, { attempts }); count++; } return { count }; },
    };
    const transport = { async sendMail(mail) { if (fail) throw new Error('SMTP failure'); deliveries.push(mail); }, close() {} };
    const dependencies = {
        'server-only': {}, 'node:crypto': { createHash }, nodemailer: { createTransport: () => transport },
        '@/lib/prisma': { prisma: { bookingNotification: model } }, '@/lib/integration-runtime': { getRuntimeSmtpConfig: async () => ({ user: 'host@example.com', password: 'test' }) },
        '@/lib/social-metadata': { getPublicSiteUrl: () => 'https://example.com' }, './server': { bookingAddonConfig: async () => config },
        './calendar': { bookingCalendarInvitation }, './calendar-access': { bookingCalendarGuestPath: () => '/booking/calendar/one?token=test' },
        './status.mjs': { bookingStatusLabel, bookingStatusCode }, './notification-policy': { bookingNotificationText, calendarForRecipient, validBookingEmail },
    };
    const loaded = { exports: {} }; new Function('exports', 'require', compiled)(loaded.exports, name => { assert.ok(name in dependencies, name); return dependencies[name]; });
    return { ...loaded.exports, jobs, deliveries, booking, config, tx: { bookingNotification: model } };
}
test('notification transaction queues client and host idempotently and sends real meeting details', async () => {
    const f = fixture(); await f.queueBookingNotifications(f.tx, f.booking, f.config); await f.queueBookingNotifications(f.tx, f.booking, f.config);
    assert.equal(f.jobs.length, 2);
    await Promise.all([f.processBookingNotifications(), f.processBookingNotifications()]);
    assert.equal(f.deliveries.length, 2); assert.deepEqual(new Set(f.deliveries.map(mail => mail.to)), new Set(['client@example.com', 'host@example.com']));
    for (const mail of f.deliveries) { assert.equal(mail.icalEvent.method, 'REQUEST'); assert.ok(mail.text.includes(f.booking.meetingUrl)); }
    // Provider may send created and confirmed events describing the same state.
    f.booking.eventAt = new Date(+f.booking.eventAt + 1000); await f.queueBookingNotifications(f.tx, f.booking, f.config); assert.equal(f.jobs.length, 2);
});
test('pending requests send information emails without a confirmed calendar event', async () => {
    const f = fixture({ status: 'PENDING' }); await f.queueBookingNotifications(f.tx, f.booking, f.config); await f.processBookingNotifications();
    assert.equal(f.deliveries.length, 2); assert.ok(f.deliveries[0].text.includes('В изчакване / Pending')); assert.equal(f.deliveries[0].icalEvent, undefined);
});
test('inactive addon queues nothing, and changed selection suppresses calendar attachments', async () => {
    const inactive = fixture({ active: false }); await inactive.queueBookingNotifications(inactive.tx, inactive.booking, inactive.config); assert.equal(inactive.jobs.length, 0);
    const f = fixture(); await f.queueBookingNotifications(f.tx, f.booking, f.config); f.config.calendarMode = 'SELECTED'; await f.processBookingNotifications();
    assert.equal(f.deliveries.length, 2); assert.equal(f.deliveries[0].icalEvent, undefined);
});
test('cancellation delivers METHOD:CANCEL for previously sent calendar invitations', async () => {
    const f = fixture(); await f.queueBookingNotifications(f.tx, f.booking, f.config); await f.processBookingNotifications();
    f.booking.eventAt = new Date(+f.booking.eventAt + 1000); f.booking.status = 'CANCELLED'; f.booking.calendarSequence++;
    await f.queueBookingNotifications(f.tx, f.booking, f.config); await f.processBookingNotifications();
    assert.equal(f.deliveries.length, 4); assert.equal(f.deliveries[2].icalEvent.method, 'CANCEL'); assert.ok(f.deliveries[2].icalEvent.content.includes('UID:cal-event'));
});
test('SMTP retries are bounded, while stale events and malformed recipient addresses never send', async () => {
    const f = fixture({ fail: true }); await f.queueBookingNotifications(f.tx, f.booking, f.config);
    for (let attempt = 0; attempt < 3; attempt++) { for (const job of f.jobs) job.dueAt = new Date(0); await f.processBookingNotifications(); }
    assert.ok(f.jobs.every(job => job.status === 'FAILED' && job.attempts === 3));
    const stale = fixture(); await stale.queueBookingNotifications(stale.tx, stale.booking, stale.config); stale.booking.eventAt = new Date(+stale.booking.eventAt + 1000); await stale.processBookingNotifications(); assert.equal(stale.deliveries.length, 0);
    const invalid = fixture(); invalid.booking.email = 'bad\r\n@example.com'; invalid.booking.organizerEmail = ''; await invalid.queueBookingNotifications(invalid.tx, invalid.booking, invalid.config); assert.equal(invalid.jobs.length, 0);
});

test('a shared client/organizer mailbox receives one invitation with the selected role policy', async () => {
    for (const recipients of ['BOTH', 'HOST', 'CLIENT']) {
        const f = fixture(); f.booking.organizerEmail = f.booking.email; f.config.calendarRecipients = recipients;
        await f.queueBookingNotifications(f.tx, f.booking, f.config); await f.processBookingNotifications();
        assert.equal(f.deliveries.length, 1); assert.equal(f.deliveries[0].icalEvent.method, 'REQUEST');
    }
});
