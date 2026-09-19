import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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

    const contentStats: Array<[string, number | null]> = [
        ['Projects', projects],
        ['Posts', posts],
        ['Pages', pages],
        ['Media', media],
        ['Draft posts', drafts],
    ];

    const updateStatus = readUpdateStatus();
    const currentVersion = installedPortfolioVersion();
    const siteModeLabel = siteMode?.mode ?? (databaseHealthy ? 'NORMAL' : 'UNKNOWN');

    return (
        <div className="mx-auto max-w-[1500px]">
            <header className="mb-6 flex flex-col gap-4 border-b border-foreground/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:text-xs">Control center</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Dashboard</h2>
                </div>
                <div className="sm:text-right">
                    <p className="text-sm text-muted-foreground">{settings?.siteName ?? 'Dr Necrotix'}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:text-xs sm:tracking-[0.2em]">Site mode: {siteModeLabel} · v{currentVersion}</p>
                </div>
            </header>

            <section className="mb-5">
                <TrafficAnalyticsPanel
                    locationLimit={4}
                    refreshIntervalMs={10000}
                    title="Traffic overview"
                    description="See visitors online right now, the pages they are viewing, total visits for the selected period and which countries those visits came from."
                />
            </section>

            <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
                <div className="min-w-0">
                    <PortfolioUpdater currentVersion={currentVersion} initialStatus={updateStatus} />
                </div>

                <div className="min-w-0 space-y-4">
                    <AdminHealthSecurityPanel />
                    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.025] p-4">
                        <div className="flex items-center justify-between gap-3"><p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Content</p><span className="text-[9px] text-muted-foreground">Current totals</span></div>
                        <div className="mt-3 grid grid-cols-5 gap-2">
                            {contentStats.map(([label, value]) => (
                                <div key={label} className="min-w-0 rounded-xl border border-foreground/10 bg-background/45 px-2 py-2.5 text-center">
                                    <p className="truncate text-[8px] uppercase tracking-[0.08em] text-muted-foreground">{label}</p><p className="mt-1 text-base font-semibold tabular-nums">{value ?? '—'}</p>
                                </div>
                            ))}
                        </div>
                        {!databaseHealthy ? <p className="mt-3 text-[10px] text-amber-700 dark:text-amber-300">Content totals are unavailable because the database query failed.</p> : null}
                        <div className="mt-3"><PurgeCacheButton /></div>
                    </div>
                </div>
            </section>
        </div>
    );
}
