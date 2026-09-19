import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminLoginSecuritySnapshot } from '@/lib/admin-login-security';
import { installedPortfolioVersion } from '@/lib/installed-version';
import { mediaStorageBackend } from '@/lib/media-storage';
import { prisma } from '@/lib/prisma';
import { SITE_HEALTH_LOG_RETENTION_DAYS, overallStatus, securityScore, type OperationalCheck } from '@/lib/site-health';
import { TRAFFIC_IP_RETENTION_HOURS, TRAFFIC_PAGE_EVENT_RETENTION_DAYS } from '@/lib/traffic-analytics';

export const dynamic = 'force-dynamic';

function item(value: Omit<OperationalCheck, 'category'> & { category?: string }): OperationalCheck {
    return { category: value.category || 'Operations', ...value };
}

function updaterCheck(): OperationalCheck {
    const shared = { id: 'updater', category: 'Release', label: 'Portfolio updater', actionHref: '/admin', actionLabel: 'Open updater' };
    try {
        const file = join(process.cwd(), 'tmp', 'update-status.json');
        if (!existsSync(file)) return item({ ...shared, status: 'ok', summary: 'Idle', detail: 'No unfinished update operation was found.', impact: 'Updates are available when needed.', resolution: ['No action is required.'] });
        const value = JSON.parse(readFileSync(file, 'utf8')) as { state?: string; message?: string };
        const failed = value.state === 'error' || value.state === 'failed';
        return item({ ...shared, status: failed ? 'error' : 'ok', summary: failed ? 'Last update failed' : value.state || 'Idle', detail: value.message || 'Latest updater state was read successfully.', impact: failed ? 'The site may remain on an older release.' : 'The updater completed or is idle.', resolution: failed ? ['Review the failed updater step.', 'Check filesystem permissions and free disk space.', 'Retry after resolving the reported cause.'] : ['No action is required.'] });
    } catch {
        return item({ ...shared, status: 'warning', summary: 'Status unreadable', detail: 'The saved updater status could not be parsed.', impact: 'The latest update result cannot be confirmed.', resolution: ['Run a fresh update status check.', 'Preserve a corrupted status file before removing it.'] });
    }
}

async function probeHomepage(request: NextRequest) {
    const origins = [process.env.NEXT_PUBLIC_SITE_URL, process.env.SITE_URL, process.env.AUTH_URL, request.nextUrl.origin]
        .filter((value): value is string => Boolean(value)).map((value) => value.replace(/\/$/, ''));
    let lastError: unknown = new Error('No public site origin is configured.');
    for (const origin of [...new Set(origins)]) {
        try {
            const startedAt = Date.now();
            const response = await fetch(new URL('/', origin), { method: 'GET', cache: 'no-store', redirect: 'follow', signal: AbortSignal.timeout(5000), headers: { 'User-Agent': 'NecrotixLab-Health/1.0' } });
            return { response, latencyMs: Date.now() - startedAt, origin };
        } catch (error) { lastError = error; }
    }
    throw lastError;
}

function browserProtection(headers: Headers): OperationalCheck[] {
    const definitions = [
        ['csp', 'Content Security Policy', 'content-security-policy', 'Reduces script injection and untrusted resource execution.', ['Keep CSP on every HTML response.', 'Restrict broad sources when integrations no longer need them.']],
        ['hsts', 'HSTS', 'strict-transport-security', 'Forces supported browsers to use HTTPS.', ['Serve HSTS from the HTTPS edge.', 'Add includeSubDomains only after every subdomain is verified.']],
        ['nosniff', 'MIME protection', 'x-content-type-options', 'Prevents MIME type guessing.', ['Set X-Content-Type-Options to nosniff.']],
        ['frame', 'Frame protection', 'x-frame-options', 'Reduces clickjacking risk.', ['Keep X-Frame-Options DENY or CSP frame-ancestors none.']],
        ['referrer', 'Referrer policy', 'referrer-policy', 'Limits URL data sent to other sites.', ['Use strict-origin-when-cross-origin or a stricter policy.']],
        ['permissions', 'Permissions policy', 'permissions-policy', 'Disables unused browser capabilities.', ['Keep camera, microphone, location and payment disabled unless required.']],
        ['coop', 'Cross-origin opener policy', 'cross-origin-opener-policy', 'Separates the browsing context from untrusted origins.', ['Set Cross-Origin-Opener-Policy to same-origin.']],
    ] as const;
    return definitions.map(([id, label, name, impact, resolution]) => {
        const value = headers.get(name);
        return item({ id, category: id === 'hsts' ? 'Transport' : id === 'referrer' ? 'Privacy' : 'Browser protection', label, status: value ? 'ok' : 'warning', summary: value || 'Missing', detail: value ? `${label} is present on the public homepage.` : `${label} was not found on the public homepage response.`, impact, resolution: [...resolution], actionHref: '/admin/security', actionLabel: 'Open Security' });
    });
}

async function persistIssues(health: OperationalCheck[], security: OperationalCheck[]) {
    const now = Date.now();
    try {
        await prisma.siteHealthLog.deleteMany({ where: { createdAt: { lt: new Date(now - SITE_HEALTH_LOG_RETENTION_DAYS * 86_400_000) } } });
        for (const [source, checks] of [['health', health], ['security', security]] as const) {
            for (const check of checks.filter((entry) => entry.status !== 'ok')) {
                const fingerprint = createHash('sha256').update(`${source}:${check.id}:${check.status}:${check.summary}`).digest('hex');
                const recent = await prisma.siteHealthLog.findFirst({ where: { fingerprint, createdAt: { gte: new Date(now - 900_000) } }, select: { id: true } });
                if (!recent) await prisma.siteHealthLog.create({ data: { source, checkId: check.id, severity: check.status, title: check.label, message: check.detail, fingerprint, details: { summary: check.summary, impact: check.impact, resolution: check.resolution } } });
            }
        }
    } catch { /* Reporting must survive a logging failure. */ }
}

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const health: OperationalCheck[] = [];
    const security: OperationalCheck[] = [];
    const dbStarted = Date.now();
    let migrationRows: Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }> = [];

    try {
        await prisma.$queryRaw`SELECT 1`;
        const latency = Date.now() - dbStarted;
        health.push(item({ id: 'database', category: 'Core services', label: 'Database', status: latency > 500 ? 'warning' : 'ok', summary: `${latency} ms`, detail: 'A live database query completed successfully.', impact: 'Database latency affects every dynamic page and admin action.', resolution: latency > 500 ? ['Review connection-pool saturation.', 'Check hosting latency and slow queries.'] : ['No action is required.'], actionHref: '/admin/service-monitoring', actionLabel: 'Service monitoring' }));
        migrationRows = await prisma.$queryRaw`SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"`;
    } catch (error) {
        health.push(item({ id: 'database', category: 'Core services', label: 'Database', status: 'error', summary: 'Unavailable', detail: error instanceof Error ? error.message : 'The database health query failed.', impact: 'Dynamic content and admin writes may be unavailable.', resolution: ['Verify DATABASE_URL and database availability.', 'Check connection limits and recent migration failures.'], actionHref: '/admin/service-monitoring', actionLabel: 'Service monitoring' }));
    }

    try {
        const { response, latencyMs, origin } = await probeHomepage(request);
        const status = !response.ok ? 'error' : latencyMs > 2500 ? 'warning' : 'ok';
        health.push(item({ id: 'public-site', category: 'Core services', label: 'Public site', status, summary: `${response.status} · ${latencyMs} ms`, detail: `Homepage probe completed through ${origin}.`, impact: status === 'ok' ? 'The homepage is reachable.' : 'Visitors may see errors or slow first responses.', resolution: response.ok ? ['Review hosting and cache performance if latency stays high.'] : ['Check the deployment and reverse proxy.', 'Review recent errors and releases.'], actionHref: '/', actionLabel: 'Open homepage' }));
        security.push(...browserProtection(response.headers));
    } catch (error) {
        health.push(item({ id: 'public-site', category: 'Core services', label: 'Public site', status: 'warning', summary: 'Probe failed', detail: error instanceof Error ? error.message : 'The public-site probe failed.', impact: 'External availability cannot be confirmed.', resolution: ['Set NEXT_PUBLIC_SITE_URL to the canonical HTTPS origin.', 'Confirm the server can reach its public hostname.', 'Check DNS, TLS and proxy rules.'], actionHref: '/admin/site-health', actionLabel: 'Troubleshoot' }));
        security.push(item({ id: 'headers', category: 'Browser protection', label: 'Security headers', status: 'warning', summary: 'Not verified', detail: 'Headers could not be checked because the public-site probe failed.', impact: 'Browser protections cannot be confirmed.', resolution: ['Resolve the public-site probe.', 'Run Security analysis again.'], actionHref: '/admin/site-health', actionLabel: 'Site Health' }));
    }

    const migrationsRoot = join(process.cwd(), 'prisma', 'migrations');
    const expected = existsSync(migrationsRoot) ? readdirSync(migrationsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name) : [];
    const applied = new Set(migrationRows.filter((row) => row.finished_at && !row.rolled_back_at).map((row) => row.migration_name));
    const failed = migrationRows.filter((row) => !row.finished_at && !row.rolled_back_at).length;
    const pending = migrationRows.length ? expected.filter((name) => !applied.has(name)).length : 0;
    health.push(item({ id: 'migrations', category: 'Data integrity', label: 'Database migrations', status: failed ? 'error' : pending ? 'warning' : migrationRows.length ? 'ok' : 'warning', summary: failed ? `${failed} failed` : pending ? `${pending} pending` : migrationRows.length ? 'Current' : 'Not verified', detail: `${applied.size} applied, ${pending} pending and ${failed} failed migrations.`, impact: 'Schema drift can break production reads and writes.', resolution: pending || failed ? ['Back up the database.', 'Review failed SQL before applying it.', 'Run prisma migrate deploy through the approved release workflow.'] : ['No action is required.'], actionHref: '/admin/site-health', actionLabel: 'Migration details' }));

    try {
        const backend = await mediaStorageBackend();
        health.push(item({ id: 'storage', category: 'Storage', label: 'Media storage', status: backend === 'r2' ? 'ok' : 'warning', summary: backend.toUpperCase(), detail: backend === 'r2' ? 'Managed object storage is configured.' : 'Local storage fallback is active.', impact: backend === 'r2' ? 'Media is independent of the app filesystem.' : 'A non-persistent deployment may lose local uploads.', resolution: backend === 'r2' ? ['No action is required.'] : ['Confirm the production filesystem is persistent.', 'Configure R2 for resilient media storage.'], actionHref: '/admin/api-integrations', actionLabel: 'Storage settings' }));
    } catch (error) {
        health.push(item({ id: 'storage', category: 'Storage', label: 'Media storage', status: 'error', summary: 'Unavailable', detail: error instanceof Error ? error.message : 'Media storage configuration failed.', impact: 'Uploads and protected media may fail.', resolution: ['Verify storage credentials and bucket configuration.', 'Test a small upload after correcting it.'], actionHref: '/admin/api-integrations', actionLabel: 'Storage settings' }));
    }
    health.push(updaterCheck());

    const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '';
    security.push(item({ id: 'auth-secret', category: 'Authentication', label: 'Authentication secret', status: authSecret.length >= 32 ? 'ok' : 'error', summary: authSecret.length >= 32 ? 'Configured' : 'Weak or missing', detail: authSecret.length >= 32 ? 'The authentication secret meets the minimum length check.' : 'The authentication secret is missing or shorter than 32 characters.', impact: 'A weak secret can compromise signed sessions.', resolution: authSecret.length >= 32 ? ['Rotate it periodically through the hosting secret manager.'] : ['Generate a random secret of at least 32 characters.', 'Store it only in the hosting secret manager.', 'Sign in again after rotation.'], actionHref: '/admin/settings', actionLabel: 'Admin settings' }));
    const throttle = adminLoginSecuritySnapshot();
    security.push(item({ id: 'login-throttle', category: 'Authentication', label: 'Login throttling', status: 'ok', summary: `${throttle.lockedBuckets} locked`, detail: `${throttle.activeBuckets} active anonymous buckets. IP lock after ${throttle.ipFailureLimit} failures for ${throttle.lockMinutes} minutes.`, impact: 'Slows repeated password guessing.', resolution: ['Review unexpected lock spikes.', 'Keep the admin password unique and strong.'], actionHref: '/admin/security', actionLabel: 'Review signals' }));
    const https = request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';
    security.push(item({ id: 'https', category: 'Transport', label: 'HTTPS request', status: https ? 'ok' : process.env.NODE_ENV === 'production' ? 'warning' : 'ok', summary: https ? 'Encrypted' : 'Local HTTP', detail: https ? 'This analysis request arrived over HTTPS.' : 'This request arrived over HTTP.', impact: 'HTTPS protects credentials and cookies in transit.', resolution: https ? ['No action is required.'] : ['Terminate public traffic with HTTPS.', 'Forward x-forwarded-proto correctly.'], actionHref: '/admin/security', actionLabel: 'Security details' }));
    security.push(item({ id: 'admin-auth', category: 'Authentication', label: 'Admin route protection', status: 'ok', summary: 'Enforced', detail: 'This endpoint requires an authenticated OWNER or ADMIN session.', impact: 'Operational details remain private.', resolution: ['Keep privileged tools restricted to OWNER and ADMIN roles.'], actionHref: '/admin/users', actionLabel: 'Review users' }));
    security.push(item({ id: 'retention', category: 'Privacy', label: 'Visitor data retention', status: 'ok', summary: `${TRAFFIC_IP_RETENTION_HOURS}h IP · ${TRAFFIC_PAGE_EVENT_RETENTION_DAYS}d activity`, detail: 'IP context and page activity use separate bounded retention windows.', impact: 'Limits stored visitor data while retaining short-term operational context.', resolution: ['Keep exports access-controlled.', 'Update the privacy notice before extending retention.'], actionHref: '/admin/experiments', actionLabel: 'Audience data' }));

    await persistIssues(health, security);
    const runtime = { version: installedPortfolioVersion(), uptimeSeconds: Math.floor(process.uptime()), memoryMb: Math.round(process.memoryUsage().rss / 1_048_576), node: process.version };
    return NextResponse.json({ status: overallStatus(health), securityStatus: overallStatus(security), securityScore: securityScore(security), health, security, runtime, logRetentionDays: SITE_HEALTH_LOG_RETENTION_DAYS, checkedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}
