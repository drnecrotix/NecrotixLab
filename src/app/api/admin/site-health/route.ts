import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminLoginSecuritySnapshot } from '@/lib/admin-login-security';
import { installedPortfolioVersion } from '@/lib/installed-version';
import { mediaStorageBackend } from '@/lib/media-storage';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type CheckStatus = 'ok' | 'warning' | 'error';
type Check = { id: string; label: string; status: CheckStatus; summary: string; detail: string };

function overall(checks: Check[]): CheckStatus {
    if (checks.some((check) => check.status === 'error')) return 'error';
    if (checks.some((check) => check.status === 'warning')) return 'warning';
    return 'ok';
}

function readUpdaterCheck(): Check {
    try {
        const file = join(process.cwd(), 'tmp', 'update-status.json');
        if (!existsSync(file)) return { id: 'updater', label: 'Updater', status: 'ok', summary: 'Idle', detail: 'No unfinished update operation was found.' };
        const value = JSON.parse(readFileSync(file, 'utf8')) as { state?: string; message?: string };
        const failed = value.state === 'error' || value.state === 'failed';
        return { id: 'updater', label: 'Updater', status: failed ? 'error' : 'ok', summary: failed ? 'Last update failed' : value.state || 'Idle', detail: value.message || 'Latest updater state was read successfully.' };
    } catch {
        return { id: 'updater', label: 'Updater', status: 'warning', summary: 'Status unreadable', detail: 'The saved updater status could not be parsed.' };
    }
}

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const health: Check[] = [];
    const security: Check[] = [];
    const dbStarted = Date.now();
    let appliedMigrations: Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }> = [];

    try {
        await prisma.$queryRaw`SELECT 1`;
        health.push({ id: 'database', label: 'Database', status: 'ok', summary: `${Date.now() - dbStarted} ms`, detail: 'A live database query completed successfully.' });
        appliedMigrations = await prisma.$queryRaw`SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"`;
    } catch (error) {
        health.push({ id: 'database', label: 'Database', status: 'error', summary: 'Unavailable', detail: error instanceof Error ? error.message : 'The database health query failed.' });
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const started = Date.now();
        const response = await fetch(new URL('/', request.url), { method: 'HEAD', cache: 'no-store', signal: controller.signal });
        clearTimeout(timeout);
        health.push({ id: 'public-site', label: 'Public site', status: response.ok ? 'ok' : 'error', summary: `${response.status} · ${Date.now() - started} ms`, detail: response.ok ? 'The public homepage responded successfully.' : `The public homepage returned HTTP ${response.status}.` });

        const expectedHeaders: Array<[string, string]> = [
            ['content-security-policy', 'Content Security Policy'], ['strict-transport-security', 'HSTS'],
            ['x-content-type-options', 'MIME protection'], ['x-frame-options', 'Frame protection'],
            ['referrer-policy', 'Referrer policy'], ['permissions-policy', 'Permissions policy'],
        ];
        const missing = expectedHeaders.filter(([name]) => !response.headers.get(name)).map(([, label]) => label);
        security.push({ id: 'headers', label: 'Security headers', status: missing.length ? 'warning' : 'ok', summary: missing.length ? `${missing.length} missing` : 'Complete', detail: missing.length ? `Missing on the public homepage: ${missing.join(', ')}.` : 'All expected browser security headers are present on the public homepage.' });
    } catch (error) {
        health.push({ id: 'public-site', label: 'Public site', status: 'warning', summary: 'Probe failed', detail: error instanceof Error ? error.message : 'The internal public-site probe failed.' });
        security.push({ id: 'headers', label: 'Security headers', status: 'warning', summary: 'Not verified', detail: 'Headers could not be checked because the public-site probe failed.' });
    }

    const migrationsRoot = join(process.cwd(), 'prisma', 'migrations');
    const expectedMigrations = existsSync(migrationsRoot) ? readdirSync(migrationsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name) : [];
    const applied = new Set(appliedMigrations.filter((row) => row.finished_at && !row.rolled_back_at).map((row) => row.migration_name));
    const failed = appliedMigrations.filter((row) => !row.finished_at && !row.rolled_back_at).length;
    const pending = appliedMigrations.length ? expectedMigrations.filter((name) => !applied.has(name)).length : 0;
    health.push({ id: 'migrations', label: 'Migrations', status: failed ? 'error' : pending ? 'warning' : appliedMigrations.length ? 'ok' : 'warning', summary: failed ? `${failed} failed` : pending ? `${pending} pending` : appliedMigrations.length ? 'Current' : 'Not verified', detail: `${applied.size} applied, ${pending} pending and ${failed} failed migrations.` });

    try {
        const backend = await mediaStorageBackend();
        health.push({ id: 'storage', label: 'Media storage', status: backend === 'r2' ? 'ok' : 'warning', summary: backend.toUpperCase(), detail: backend === 'r2' ? 'Managed object storage is configured.' : 'Local storage fallback is active. Verify that production storage is persistent.' });
    } catch (error) {
        health.push({ id: 'storage', label: 'Media storage', status: 'error', summary: 'Unavailable', detail: error instanceof Error ? error.message : 'Media storage configuration failed.' });
    }
    health.push(readUpdaterCheck());

    const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '';
    security.push({ id: 'auth-secret', label: 'Authentication secret', status: authSecret.length >= 32 ? 'ok' : 'error', summary: authSecret.length >= 32 ? 'Configured' : 'Weak or missing', detail: authSecret.length >= 32 ? 'The authentication secret meets the minimum length check.' : 'Set a randomly generated authentication secret of at least 32 characters.' });
    const throttle = adminLoginSecuritySnapshot();
    security.push({ id: 'login-throttle', label: 'Login throttling', status: 'ok', summary: `${throttle.lockedBuckets} locked`, detail: `${throttle.activeBuckets} active anonymous throttle buckets. IP lock after ${throttle.ipFailureLimit} failures for ${throttle.lockMinutes} minutes.` });
    const https = request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';
    security.push({ id: 'https', label: 'HTTPS request', status: https ? 'ok' : process.env.NODE_ENV === 'production' ? 'warning' : 'ok', summary: https ? 'Encrypted' : 'Local HTTP', detail: https ? 'This health request arrived over HTTPS.' : 'HTTP is acceptable locally, but production traffic should terminate with HTTPS.' });

    return NextResponse.json({
        status: overall(health), securityStatus: overall(security), health, security,
        runtime: { version: installedPortfolioVersion(), uptimeSeconds: Math.floor(process.uptime()), memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024) },
        checkedAt: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}
