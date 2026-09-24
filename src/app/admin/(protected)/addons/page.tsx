import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BUNDLED_ADDONS } from '@/modules/addons/catalog';
import { normalizeServiceTools, SERVICE_TOOLS_CONFIG_SLUG } from '@/modules/service-tools/settings';
import { setAddonState } from './actions';

export default async function AddonsPage() {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) redirect('/admin');
    const config = await prisma.page.findUnique({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, select: { content: true } }).catch(() => null);
    const tools = normalizeServiceTools(config?.content);
    const enabledCount = BUNDLED_ADDONS.filter((addon) => tools.some((tool) => tool.id === addon.id && tool.enabled && !tool.comingSoon)).length;

    return <div className="mx-auto max-w-6xl space-y-7">
        <header className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">CMS / Extensions</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Addons</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Install or disable modules included with this NecrotixLab release. The core CMS and its content stay in place. External code uploads are not supported.</p>
            <p className="mt-4 text-sm font-semibold">{enabledCount} of {BUNDLED_ADDONS.length} installed</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
            {BUNDLED_ADDONS.map((addon) => {
                const tool = tools.find((item) => item.id === addon.id);
                const installed = Boolean(tool?.enabled && !tool.comingSoon);
                return <article key={addon.id} className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-cyan-500/50">
                    <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">{addon.area}</p><h2 className="mt-2 text-xl font-semibold">{addon.name}</h2></div><span className={`rounded-full border px-2.5 py-1 text-xs ${installed ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'border-border text-muted-foreground'}`}>{installed ? 'Installed' : 'Disabled'}</span></div>
                    <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{addon.description}</p>
                    <div className="mt-5 flex items-center gap-3"><form action={setAddonState}><input type="hidden" name="id" value={addon.id} /><input type="hidden" name="enabled" value={String(!installed)} /><button type="submit" className={`min-h-10 rounded-lg px-4 text-sm font-semibold transition-colors ${installed ? 'border border-border hover:bg-muted' : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}>{installed ? 'Disable' : 'Install'}</button></form>{installed && <Link href={addon.href} className="text-sm text-cyan-600 hover:underline dark:text-cyan-400">Open module</Link>}</div>
                </article>;
            })}
        </div>
        <p className="text-xs leading-5 text-muted-foreground">Installation activates code already shipped with this version. Disabling removes its catalogue entry and blocks its page and server endpoints. Manage names and ordering in <Link href="/admin/service-tools" className="underline">Service Tools</Link>.</p>
    </div>;
}
