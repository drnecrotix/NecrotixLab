import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Download, ExternalLink, PackagePlus, RefreshCw, Search, Settings2, UploadCloud } from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { StatusToast } from '@/components/admin/StatusToast';
import { AddonSubmitButton } from '@/components/admin/AddonSubmitButton';
import { catalogueRepo, githubAddonCatalogue, type MarketplaceAddon } from '@/lib/addon-marketplace.server';
import { ADDONS_REGISTRY_SLUG, stagedAddons } from '@/lib/addon-staging.server';
import { compareVersions } from '@/modules/addons/package';
import { normalizeServiceToolsConfig, SERVICE_TOOLS_CONFIG_SLUG, TOOLS_ADDON_VERSION } from '@addons/Tools/settings';
import { installGithubAddon, removeStagedAddon, setToolsAddonState, uploadAddon } from './actions';

type Tab = 'available' | 'installed' | 'add-new';
const tabClass = 'inline-flex min-h-11 items-center border-b-2 px-4 text-sm font-semibold transition-colors';
const bundledTools: MarketplaceAddon = {
    id: 'tools',
    name: 'Tools',
    version: TOOLS_ADDON_VERSION,
    requiresCms: TOOLS_ADDON_VERSION,
    description: 'Website, file, media and CNC utilities in one package.',
    directory: 'Tools',
};

export default async function AddonsPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; refresh?: string; imported?: string; saved?: string; error?: string }> }) {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) redirect('/admin');
    const params = await searchParams;
    const refreshRequested = params.refresh === '1';
    const [record, registry, marketplace] = await Promise.all([
        prisma.page.findUnique({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, select: { content: true } }).catch(() => null),
        prisma.page.findUnique({ where: { slug: ADDONS_REGISTRY_SLUG }, select: { content: true } }).catch(() => null),
        githubAddonCatalogue(refreshRequested),
    ]);
    const config = normalizeServiceToolsConfig(record?.content);
    const staged = stagedAddons(registry?.content);
    const tab: Tab = params.tab === 'installed' || params.tab === 'add-new' ? params.tab : 'available';
    const query = (params.q || '').trim().slice(0, 80).toLowerCase();
    const publishedTools = marketplace.addons.find((item) => item.id === 'tools');
    const catalogue = (publishedTools ? marketplace.addons : [bundledTools, ...marketplace.addons]);
    const available = catalogue.filter((item) => !query || `${item.name} ${item.description} ${item.id}`.toLowerCase().includes(query));
    const toolsGithubAhead = Boolean(publishedTools && compareVersions(publishedTools.version, config.packageVersion) > 0);
    const toolsCmsAhead = compareVersions(TOOLS_ADDON_VERSION, config.packageVersion) > 0;
    const toolsNeedsCms = Boolean(publishedTools && compareVersions(publishedTools.version, TOOLS_ADDON_VERSION) > 0);
    const toolsUpdateReady = config.installed && toolsCmsAhead;
    const stagedUpdates = staged.filter((item) => {
        const remote = catalogue.find((addon) => addon.id === item.id);
        return Boolean(remote && compareVersions(remote.version, item.version) > 0);
    });
    const updatesCount = (config.installed && (toolsUpdateReady || toolsGithubAhead) ? 1 : 0) + stagedUpdates.length;
    const installedCount = (config.installed ? 1 : 0) + staged.length;
    const toastMessage = params.error
        || (params.imported ? 'Plugin package received.' : undefined)
        || (params.saved === 'updated' ? 'Tools updated to the version included in this CMS.' : undefined)
        || (params.saved === 'state' ? 'Addon state changed.' : undefined)
        || (params.saved ? 'Settings saved.' : undefined)
        || (refreshRequested && !marketplace.error ? (updatesCount ? `${updatesCount} addon update${updatesCount === 1 ? '' : 's'} available.` : 'Catalogue checked. Everything is current.') : undefined);

    return <div className="mx-auto max-w-6xl space-y-6">
        <StatusToast type={params.error ? 'error' : toastMessage ? 'success' : undefined} message={toastMessage} />
        <header className="flex flex-wrap items-end justify-between gap-5">
            <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500">CMS / Extensions</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Addons</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Available is the install catalogue. Installed is only what this CMS already has. Settings live on each addon’s own page.</p>
            </div>
            <div className="flex flex-wrap gap-3">
                <Link href="/admin/addons?tab=available&refresh=1" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold hover:border-cyan-500 hover:text-cyan-500">
                    <RefreshCw className="size-4" /> Check updates
                </Link>
                <Link href="/admin/addons?tab=add-new" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-bold text-white transition hover:bg-cyan-700">
                    <PackagePlus className="size-4" /> Add New
                </Link>
            </div>
        </header>

        {updatesCount > 0 && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
            {updatesCount} update{updatesCount === 1 ? '' : 's'} available.
            {toolsNeedsCms ? ' A newer Tools package is on GitHub — update this CMS build first.' : ''}
            {' '}<Link href="/admin/addons?tab=installed" className="font-semibold underline">Review in Installed</Link>
        </div>}

        <div className="border-t border-border">
            <nav aria-label="Addon sections" className="flex flex-wrap border-b border-border">
                {([['available', 'Available', available.length], ['installed', 'Installed', installedCount], ['add-new', 'Upload ZIP', null]] as const).map(([key, label, count]) => (
                    <Link key={key} href={`/admin/addons?tab=${key}`} aria-current={tab === key ? 'page' : undefined} className={`${tabClass} ${tab === key ? 'border-cyan-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                        {label}
                        {count !== null && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{count}</span>}
                        {key === 'installed' && updatesCount > 0 && <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-500">{updatesCount}</span>}
                    </Link>
                ))}
            </nav>

            {tab === 'available' && <div className="p-5 sm:p-7">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold">Available addons</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Catalogue from the official <a href={`https://github.com/${catalogueRepo}/tree/main/Addons`} target="_blank" rel="noopener noreferrer" className="text-cyan-500 underline">GitHub Addons repository</a>. Install from here; settings stay off this list.</p>
                    </div>
                    <form action="/admin/addons" method="get" className="flex w-full items-center gap-2 rounded-xl border border-border bg-background px-3 sm:w-72">
                        <input type="hidden" name="tab" value="available" />
                        <Search className="size-4 text-muted-foreground" />
                        <input name="q" defaultValue={params.q || ''} placeholder="Search addons" aria-label="Search addons" className="min-h-11 w-full bg-transparent text-sm outline-none" />
                        <button className="text-xs font-semibold text-cyan-500">Search</button>
                    </form>
                </div>
                {marketplace.error && <p className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">GitHub catalogue unavailable: {marketplace.error}. Bundled Tools is still listed.</p>}
                <div className="mt-6 divide-y divide-border border-y border-border">
                    {available.map((item) => {
                        const isTools = item.id === 'tools';
                        const stagedPackage = staged.find((addon) => addon.id === item.id);
                        const installed = isTools ? config.installed : Boolean(stagedPackage);
                        const installedVersion = isTools && config.installed ? config.packageVersion : stagedPackage?.version;
                        const newer = Boolean(installedVersion && compareVersions(item.version, installedVersion) > 0);
                        const needsCms = isTools && compareVersions(item.version, TOOLS_ADDON_VERSION) > 0;
                        return <article key={item.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 flex-wrap items-center gap-3">
                                <span className="grid size-9 shrink-0 place-items-center text-cyan-500"><PackagePlus className="size-5" /></span>
                                <div>
                                    <h3 className="font-bold">{item.name}</h3>
                                    <p className="text-xs text-muted-foreground">Version {item.version} · CMS {item.requiresCms || TOOLS_ADDON_VERSION}+</p>
                                </div>
                                {installed && <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${newer ? 'border-amber-500/40 text-amber-500' : 'border-border text-muted-foreground'}`}>{newer ? 'Update available' : 'Installed'}</span>}
                            </div>
                            <p className="min-w-0 flex-1 text-sm leading-6 text-muted-foreground sm:px-4">{item.description}</p>
                            <div className="flex shrink-0 flex-wrap items-center gap-3">
                                {needsCms ? <span className="text-xs font-semibold text-amber-500">Update CMS before installing</span>
                                    : isTools && !config.installed ? <form action={setToolsAddonState}><input type="hidden" name="operation" value="install" /><AddonSubmitButton pendingLabel="Installing..." className="min-h-10 rounded-lg bg-cyan-600 px-4 text-sm font-bold text-white">Install</AddonSubmitButton></form>
                                    : isTools && toolsUpdateReady ? <form action={setToolsAddonState}><input type="hidden" name="operation" value="update" /><AddonSubmitButton pendingLabel="Updating..." className="min-h-10 rounded-lg bg-cyan-600 px-4 text-sm font-bold text-white">Update</AddonSubmitButton></form>
                                    : isTools && config.installed ? <Link href="/admin/addons?tab=installed" className="text-sm font-semibold text-cyan-500 hover:underline">View installed</Link>
                                    : stagedPackage && !newer ? <Link href="/admin/addons?tab=installed" className="text-sm font-semibold text-cyan-500 hover:underline">View installed</Link>
                                    : <form action={installGithubAddon}><input type="hidden" name="id" value={item.id} /><AddonSubmitButton pendingLabel="Downloading..." className="min-h-10 rounded-lg bg-cyan-600 px-4 text-sm font-bold text-white">{newer ? 'Download update' : 'Install'}</AddonSubmitButton></form>}
                                <a href={`https://github.com/${catalogueRepo}/tree/main/Addons/${encodeURIComponent(item.directory)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-500 hover:underline">Details <ExternalLink className="size-3" /></a>
                            </div>
                        </article>;
                    })}
                </div>
                {available.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No addons match this search.</p>}
            </div>}

            {tab === 'installed' && <div className="p-5 sm:p-7">
                <h2 className="text-xl font-bold">Installed addons</h2>
                <p className="mt-1 text-sm text-muted-foreground">Packages already on this CMS. Open Settings for an addon instead of embedding its options here.</p>
                <div className="mt-6 divide-y divide-border border-y border-border">
                    {config.installed && <article className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <h3 className="text-lg font-bold">Tools</h3>
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${config.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>{config.active ? 'Active' : 'Inactive'}</span>
                                {toolsUpdateReady && <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">Update ready</span>}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">v{config.packageVersion} · Official · {config.tools.length} tools</p>
                            {toolsNeedsCms && <p className="mt-2 text-xs text-amber-500">GitHub has {publishedTools?.version}. Update the CMS build before that package can apply.</p>}
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            {toolsUpdateReady && <form action={setToolsAddonState}><input type="hidden" name="operation" value="update" /><AddonSubmitButton pendingLabel="Updating..." className="text-sm font-semibold text-amber-500 hover:underline bg-transparent px-0 min-h-0">Update</AddonSubmitButton></form>}
                            <form action={setToolsAddonState}><input type="hidden" name="operation" value={config.active ? 'deactivate' : 'activate'} /><button className="text-sm font-semibold text-cyan-500 hover:underline">{config.active ? 'Deactivate' : 'Activate'}</button></form>
                            <Link href="/admin/addons/tools" className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-500 hover:underline"><Settings2 className="size-4" /> Settings</Link>
                            <a href="/api/admin/addons/tools/download" className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-500 hover:underline"><Download className="size-4" /> ZIP</a>
                            {!config.active && <form action={setToolsAddonState}><input type="hidden" name="operation" value="uninstall" /><button className="text-sm font-semibold text-rose-500 hover:underline">Uninstall</button></form>}
                        </div>
                    </article>}
                    {staged.map((item) => {
                        const remote = catalogue.find((addon) => addon.id === item.id);
                        const newer = Boolean(remote && compareVersions(remote.version, item.version) > 0);
                        return <article key={item.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h3 className="text-lg font-bold">{item.name}</h3>
                                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">Awaiting compatible build</span>
                                    {newer && <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">Update available</span>}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">v{item.version} · {item.source === 'github' ? 'GitHub' : 'Custom ZIP'} · CMS {item.requiresCms}+</p>
                                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                {newer && remote && <form action={installGithubAddon}><input type="hidden" name="id" value={item.id} /><AddonSubmitButton pendingLabel="Downloading..." className="text-sm font-semibold text-amber-500 hover:underline bg-transparent px-0 min-h-0">Download update</AddonSubmitButton></form>}
                                <a href={`/api/admin/addons/custom/${encodeURIComponent(item.id)}`} className="text-sm font-semibold text-cyan-500 hover:underline">Download ZIP</a>
                                <form action={removeStagedAddon}><input type="hidden" name="id" value={item.id} /><button className="text-sm font-semibold text-rose-500 hover:underline">Delete</button></form>
                            </div>
                        </article>;
                    })}
                </div>
                {installedCount === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center">
                    <p className="text-sm text-muted-foreground">No addons installed yet.</p>
                    <Link href="/admin/addons?tab=available" className="mt-3 inline-block text-sm font-semibold text-cyan-500">Browse the catalogue</Link>
                </div>}
            </div>}

            {tab === 'add-new' && <div className="p-5 sm:p-7">
                <div className="flex items-start gap-4">
                    <span className="grid size-12 place-items-center rounded-xl bg-cyan-500/10 text-cyan-500"><UploadCloud className="size-6" /></span>
                    <div>
                        <h2 className="text-xl font-bold">Upload a custom addon</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Choose a ZIP containing one <code>Addons/Name/manifest.json</code>. The manifest needs an ID, name, version, minimum CMS version and description.</p>
                    </div>
                </div>
                <form action={uploadAddon} className="mt-7 flex flex-wrap items-end gap-4 rounded-xl border border-dashed border-border bg-background p-5">
                    <label className="text-sm font-semibold">Plugin ZIP <span className="font-normal text-muted-foreground">(max 2 MB)</span>
                        <input type="file" name="package" accept=".zip,application/zip" required className="mt-3 block max-w-full text-sm font-normal" />
                    </label>
                    <button className="min-h-11 rounded-xl bg-cyan-600 px-5 text-sm font-bold text-white">Upload plugin</button>
                </form>
                <p className="mt-5 text-xs leading-6 text-muted-foreground">Custom ZIPs are saved privately and listed under Installed. New executable pages or server routes need a reviewed CMS build before activation. Uploaded code is never executed on request.</p>
                <p className="mt-3 text-xs text-muted-foreground">Prefer an official package? <Link href="/admin/addons?tab=available" className="font-semibold text-cyan-500 underline">Browse the catalogue</Link>.</p>
            </div>}
        </div>
    </div>;
}
