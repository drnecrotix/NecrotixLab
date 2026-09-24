import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ServiceToolsEditor } from '@/components/admin/ServiceToolsEditor';
import { StatusToast } from '@/components/admin/StatusToast';
import { normalizeServiceToolsConfig, SERVICE_TOOLS_CONFIG_SLUG } from '@addons/Tools/settings';
import { updateServiceTools } from '../../service-tools/actions';

export default async function ToolsAddonSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) redirect('/admin');
    const params = await searchParams;
    const record = await prisma.page.findUnique({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, select: { content: true } }).catch(() => null);
    const config = normalizeServiceToolsConfig(record?.content);
    if (!config.installed) redirect('/admin/addons?tab=available');

    return <div className="mx-auto max-w-6xl space-y-6">
        <StatusToast type={params.error ? 'error' : params.saved ? 'success' : undefined} message={params.error || (params.saved ? 'Tool settings saved.' : undefined)} />
        <Link href="/admin/addons?tab=installed" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-cyan-500 hover:underline">
            <ArrowLeft className="size-4" /> Back to Installed
        </Link>
        <header>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500">Addons / Tools</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Tools settings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Labels, icons, order and visibility for this addon only. Activation stays on Installed.</p>
        </header>
        <ServiceToolsEditor initialTools={config.tools} action={updateServiceTools} />
    </div>;
}
