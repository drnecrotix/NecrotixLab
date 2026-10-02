import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { reminderDue } from '../../Addons/Booking/workflow-policy.ts';
// Load the production transaction function without Next's server-only marker.
// Prisma imports are types; inject only its pure clock policy dependency.
const source = readFileSync(new URL('../../Addons/Booking/workflows.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source.replace("import 'server-only';", '').replace("import { reminderDue } from './workflow-policy';", ''), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const loaded = { exports: {} };
new Function('exports', 'reminderDue', compiled)(loaded.exports, reminderDue);
const { synchronizeBookingWorkflows } = loaded.exports;
function fixture() {
    const jobs = []; const projects = []; const calls = [];
    const tx = {
        bookingReminder: {
            async updateMany(args) { calls.push(args); },
            async upsert({ create }) { if (!jobs.some(job => job.reservationId === create.reservationId && +job.startTime === +create.startTime && job.hours === create.hours)) jobs.push(create); },
        },
        bookingProject: { async upsert({ create }) { if (!projects.some(project => project.reservationId === create.reservationId)) projects.push(create); } },
    };
    const reservation = { id: 'one', status: 'CONFIRMED', title: 'Consultation', email: 'customer@example.com', startTime: new Date(Date.now() + 86400000 * 10) };
    const config = { installed: true, active: true, autoProject: true, reminderHours: 24 };
    return { tx, reservation, config, jobs, projects, calls };
}
test('repeated confirmations preserve a single project and reminder key', async () => {
    const f = fixture();
    await synchronizeBookingWorkflows(f.tx, f.reservation, f.config);
    await synchronizeBookingWorkflows(f.tx, f.reservation, f.config);
    assert.equal(f.jobs.length, 1); assert.equal(f.projects.length, 1);
    assert.equal(f.jobs[0].dueAt.getTime(), f.reservation.startTime.getTime() - 86400000);
    assert.equal(f.calls[1].where.status, 'CANCELLED'); // only a cancelled job may be reactivated
});
test('cancellation cancels outstanding jobs without creating a new project or reminder', async () => {
    const f = fixture(); f.reservation.status = 'CANCELLED';
    await synchronizeBookingWorkflows(f.tx, f.reservation, f.config);
    assert.equal(f.jobs.length, 0); assert.equal(f.projects.length, 0);
    assert.deepEqual(f.calls[0].where.status.in, ['PENDING', 'PROCESSING']);
    assert.deepEqual(f.calls[0].where.OR.at(-1), {});
    assert.equal(f.calls[0].data.status, 'CANCELLED');
});
test('a changed start time produces a new reminder key and invalidates the old schedule', async () => {
    const f = fixture();
    await synchronizeBookingWorkflows(f.tx, f.reservation, f.config);
    f.reservation = { ...f.reservation, startTime: new Date(+f.reservation.startTime + 86400000) };
    await synchronizeBookingWorkflows(f.tx, f.reservation, f.config);
    assert.equal(f.jobs.length, 2); assert.equal(f.projects.length, 1);
    assert.equal(+f.calls[2].where.OR[0].startTime.not, +f.reservation.startTime);
});
test('inactive addon and pending approval do not create projects or reminders', async () => {
    for (const condition of ['inactive', 'pending']) {
        const f = fixture();
        if (condition === 'inactive') f.config.active = false; else f.reservation.status = 'PENDING';
        await synchronizeBookingWorkflows(f.tx, f.reservation, f.config);
        assert.equal(f.jobs.length, 0); assert.equal(f.projects.length, 0);
    }
});
