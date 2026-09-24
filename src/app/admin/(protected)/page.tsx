import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AdminHealthSecurityPanel } from '@/components/admin/AdminHealthSecurityPanel';
import { PortfolioUpdater, type PortfolioUpdateStatus } from '@/components/admin/PortfolioUpdater';
import { PurgeCacheButton } from '@/components/admin/PurgeCacheButton';
import { TrafficAnalyticsPanel } from '@/components/admin/TrafficAnalyticsPanel';
import { installedPortfolioVersion } from '@/lib/installed-version';

export const dynamic = 'force-dynamic';

function readUpdateStatus(): PortfolioUpdateStatus | null {
    try {
        const file = join(process.cwd(), 'tmp', 'update-status.json');
        return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) as PortfolioUpdateStatus : null;
    } catch { return null; }
}

export default async function AdminDashboardPage() {
    const session = await auth();
    const canManageAddons = session?.user?.role === 'OWNER' || session?.user?.role === 'ADMIN';
    let projects: number | null = null;
    let posts: number | null = null;
    let pages: number | null = null;
    let media: number | null = null;
    let drafts: number | null = null;
    let settings: { siteName: string } | null = null;
    let siteMode: { mode: string } | null = null;
    let databaseHealthy = false;

    try {
        const result = await prisma.$transaction([
            prisma.project.count(),
            prisma.post.count(),
            prisma.page.count(),
            prisma.mediaAsset.count(),
            prisma.post.count({ where: { status: 'DRAFT' } }),
            prisma.siteSettings.findUnique({ where: { id: 'default' }, select: { siteName: true } }),
            prisma.siteModeSettings.findUnique({ where: { id: 'default' }, select: { mode: true } }),
        ]);

        [projects, posts, pages, media, drafts, settings, siteMode] = result;
        databaseHealthy = true;
    } catch {
        // Keep the control center renderable when the database is unavailable so
        // the health panel can report the failure instead of claiming success.
    }

    const contentStats: Array<[string, number | null, string]> = [
        ['Projects', projects, '/admin/projects'],
        ['Posts', posts, '/admin/blog'],
        ['Pages', pages, '/admin/pages'],
        ['Media', media, '/admin/media'],
        ['Draft posts', drafts, '/admin/blog'],
    ];

    const updateStatus = readUpdateStatus();
    const currentVersion = installedPortfolioVersion();
    const siteModeLabel = siteMode?.mode ?? (databaseHealthy ? 'NORMAL' : 'UNKNOWN');

    return (
        <div className="admin-dashboard mx-auto max-w-[1500px] space-y-5">
            <header className="admin-dashboard-enter flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
                <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">NecrotixLab / Control center</p>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Dashboard</h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Content, traffic, system health and updates in one workspace.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="rounded-full border border-border px-3 py-1.5 text-xs font-medium">{settings?.siteName ?? 'NecrotixLab'}</span>
                    <span className="rounded-full border border-cyan-500/25 bg-cyan-500/[0.07] px-3 py-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300">{siteModeLabel}</span>
                    <span className="rounded-full border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground">v{currentVersion}</span>
                </div>
            </header>

            <section aria-label="Content overview" className="admin-dashboard-enter grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                {contentStats.map(([label, value, href], index) => (
                    <Link key={label} href={href} className="group min-w-0 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-cyan-500/50 hover:bg-cyan-500/[0.04]" style={{ animationDelay: `${index * 45}ms` }}>
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
                        <span className="mt-3 block text-3xl font-bold tabular-nums">{value ?? '—'}</span>
                        <span className="mt-2 block text-xs text-cyan-700 opacity-70 transition-opacity group-hover:opacity-100 dark:text-cyan-300">Open section →</span>
                    </Link>
                ))}
            </section>
            {!databaseHealthy && <p className="rounded-xl border border-amber-500/30 p-3 text-xs text-amber-700 dark:text-amber-300">Content totals are unavailable because the database query failed.</p>}

            <nav aria-label="Quick actions" className="admin-dashboard-enter flex flex-wrap gap-2">
                {[['Blog posts', '/admin/blog'], ['Projects', '/admin/projects'], ['Media library', '/admin/media'], ...(canManageAddons ? [['Addons', '/admin/addons'], ['Site health', '/admin/site-health']] : [])].map(([label, href]) => (
                    <Link key={href} href={href} className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold transition-colors hover:border-cyan-500/50 hover:text-cyan-700 dark:hover:text-cyan-300">{label}</Link>
                ))}
            </nav>

            <section className="admin-dashboard-enter" aria-label="Traffic">
                <TrafficAnalyticsPanel
                    locationLimit={4}
                    refreshIntervalMs={10000}
                    title="Traffic overview"
                    description="See visitors online right now, the pages they are viewing, total visits for the selected period and which countries those visits came from."
                />
            </section>

            <section className="admin-dashboard-enter grid items-start gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]" aria-label="Operations">
                <div className="min-w-0">
                    <PortfolioUpdater currentVersion={currentVersion} initialStatus={updateStatus} />
                </div>

                <div className="min-w-0 space-y-4">
                    <AdminHealthSecurityPanel />
                    <div className="rounded-2xl border border-border bg-card p-5">
                        <h2 className="text-sm font-semibold">Maintenance</h2>
                        <p className="mt-1 text-xs text-muted-foreground">Clear cached content after a configuration change.</p>
                        <div className="mt-4"><PurgeCacheButton /></div>
                    </div>
                </div>
            </section>
        </div>
    );
}
