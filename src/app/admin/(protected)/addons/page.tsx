import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ServiceToolsEditor } from '@/components/admin/ServiceToolsEditor';
import { StatusToast } from '@/components/admin/StatusToast';
import { catalogueRepo, githubAddonCatalogue } from '@/lib/addon-marketplace.server';
import { normalizeServiceToolsConfig, SERVICE_TOOLS_CONFIG_SLUG, TOOLS_ADDON_VERSION } from '@addons/Tools/settings';
import { updateServiceTools } from '../service-tools/actions';
import { importToolsAddon, setToolsAddonState } from './actions';

export default async function AddonsPage({ searchParams }: { searchParams: Promise<{ imported?: string; saved?: string; error?: string }> }) {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) redirect('/admin');
    const [record, params, marketplace] = await Promise.all([
        prisma.page.findUnique({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, select: { content: true } }).catch(() => null),
        searchParams,
        githubAddonCatalogue(),
    ]);
    const config = normalizeServiceToolsConfig(record?.content);
    const publishedTools = marketplace.addons.find((addon) => addon.id === 'tools');
    const updateAvailable = Boolean(publishedTools && publishedTools.version.split('.').some((part, index) => Number(part) > Number(config.packageVersion.split('.')[index] || 0) && publishedTools.version.split('.').slice(0, index).every((previous, previousIndex) => Number(previous) === Number(config.packageVersion.split('.')[previousIndex] || 0))));
    return <div className="mx-auto max-w-6xl space-y-7">
        <StatusToast type={params.error ? 'error' : params.imported || params.saved ? 'success' : undefined} message={params.error || (params.imported ? 'Tools package installed or updated.' : params.saved ? 'Tool settings saved.' : undefined)} />
        <header className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">CMS / Extensions</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Addons</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Install and manage optional CMS packages. Tools contains the complete catalogue and settings for every tool.</p>
            <nav className="mt-6 flex flex-wrap gap-2 text-sm font-semibold"><a className="rounded-lg bg-foreground px-4 py-2 text-background" href="#installed">Installed plugins</a><a className="rounded-lg border border-border px-4 py-2" href="#add-new">Add New / Upload plugin</a></nav>
        </header>
        <section id="installed"><h2 className="mb-4 text-xl font-bold">Installed plugins <span className="text-muted-foreground">({config.installed ? 1 : 0})</span></h2>
        <article className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-500">Bundled plugin / v{config.packageVersion}</p><h3 className="mt-2 text-2xl font-bold">Tools</h3><p className="mt-2 text-sm text-muted-foreground">Website, file, media and CNC utilities in one addon.</p></div><span className="rounded-full border border-border px-3 py-1 text-xs">{config.active ? 'Active' : config.installed ? 'Inactive' : 'Available to install'}</span></div>
            {updateAvailable && <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">Version {publishedTools?.version} is available in GitHub. Update the CMS build before importing its ZIP.</p>}
            <div className="mt-6 flex flex-wrap items-center gap-3"><form action={setToolsAddonState}><input type="hidden" name="operation" value={config.installed ? config.active ? 'deactivate' : 'activate' : 'install'} /><button className="min-h-11 rounded-lg bg-cyan-600 px-4 text-sm font-semibold text-white">{config.installed ? config.active ? 'Deactivate' : 'Activate' : 'Install'}</button></form>{config.installed && !config.active && <form action={setToolsAddonState}><input type="hidden" name="operation" value="uninstall" /><button className="min-h-11 rounded-lg border border-border px-4 text-sm font-semibold">Uninstall</button></form>}<a href="/api/admin/addons/tools/download" download className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold">Download ZIP</a>{config.active && <Link href="/tools" className="text-sm text-cyan-500 hover:underline">Open Tools</Link>}</div>
            <p className="mt-4 text-xs text-muted-foreground">Included version: {TOOLS_ADDON_VERSION}. Settings are retained when deactivated or uninstalled.</p>
        </article>
        </section>
        <section id="add-new" className="rounded-2xl border border-border bg-card p-6"><h2 className="text-xl font-bold">Add New / Upload plugin</h2><p className="mt-2 text-sm text-muted-foreground">The catalogue checks the <a className="underline" href={`https://github.com/${catalogueRepo}/tree/main/Addons`} target="_blank" rel="noopener noreferrer">GitHub Addons folder</a> for packages and new versions. <a className="underline" href="/admin/addons#add-new">Check again</a></p>{marketplace.error && <p className="mt-3 text-xs text-amber-500">GitHub catalogue unavailable: {marketplace.error}</p>}{marketplace.addons.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2">{marketplace.addons.map((addon) => <article key={addon.id} className="rounded-xl border border-border p-4"><p className="text-xs text-cyan-500">v{addon.version} / Requires CMS {addon.requiresCms}</p><h3 className="mt-1 font-semibold">{addon.name}</h3><p className="mt-2 text-xs text-muted-foreground">{addon.description}</p><a className="mt-3 inline-block text-xs font-semibold text-cyan-500 underline" href={`https://github.com/${catalogueRepo}/tree/main/Addons/${encodeURIComponent(addon.directory)}`} target="_blank" rel="noopener noreferrer">View package on GitHub</a></article>)}</div>}<form action={importToolsAddon} className="mt-5 flex flex-wrap items-end gap-3"><label className="text-sm">Tools plugin ZIP<input type="file" name="package" accept=".zip,application/zip" required className="mt-2 block max-w-full text-xs" /></label><button className="min-h-10 rounded-lg border border-border px-4 text-sm font-semibold">Install / Update</button></form><p className="mt-4 text-xs leading-5 text-muted-foreground">The CMS verifies the package manifest and activates code included in this build. Deploy a newer CMS build before installing a newer plugin version. Uploaded scripts are not executed.</p></section>
        {config.installed && <section id="tools-settings"><h2 className="text-2xl font-bold">Tools settings</h2><p className="mt-2 text-sm text-muted-foreground">Configure the name, icon, route, visibility and availability of each tool. Settings remain saved when the package is disabled.</p><ServiceToolsEditor initialTools={config.tools} action={updateServiceTools} /></section>}
    </div>;
}
