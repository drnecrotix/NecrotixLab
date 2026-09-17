import { prisma } from '@/lib/prisma';
import { PWA_CONFIG_SLUG, normalizePwaSettings } from '@/lib/pwa-settings';
import { PwaSettingsWorkbench } from '@/components/admin/PwaSettingsWorkbench';
import { StatusToast } from '@/components/admin/StatusToast';

export const dynamic = 'force-dynamic';

export default async function PwaAdminPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
    const [page, params] = await Promise.all([
        prisma.page.findUnique({
            where: { slug: PWA_CONFIG_SLUG },
            select: { content: true, updatedAt: true },
        }).catch(() => null),
        searchParams,
    ]);

    const settings = normalizePwaSettings(page?.content);

    return (
        <div className="mx-auto max-w-[1500px]">
            <StatusToast type={params.error ? 'error' : params.saved ? 'success' : undefined} message={params.error || (params.saved ? 'PWA settings saved.' : undefined)} />
            <div className="mb-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Appearance</p>
                <h2 className="mt-1 text-3xl font-semibold">Progressive Web App</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    SuperPWA-style controls for the installed app. Pick one source logo and the 192/512/maskable/monochrome pack plus iOS splash are generated from it. Add a launch splash variant and a journal/wiki reader (also in the browser). Native chrome still only appears after install.
                </p>
            </div>
            <PwaSettingsWorkbench initial={settings} updatedAt={page?.updatedAt.toISOString() ?? null} />
        </div>
    );
}
