import { ServiceToolsEditor } from '@/components/admin/ServiceToolsEditor';
import { StatusToast } from '@/components/admin/StatusToast';
import { prisma } from '@/lib/prisma';
import { normalizeServiceTools, SERVICE_TOOLS_CONFIG_SLUG } from '@/modules/service-tools/settings';
import { updateServiceTools } from './actions';

export default async function ServiceToolsAdminPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
    const [config, params] = await Promise.all([
        prisma.page.findUnique({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, select: { content: true } }).catch(() => null),
        searchParams,
    ]);
    const tools = normalizeServiceTools(config?.content);
    return (
        <div className="mx-auto max-w-5xl">
            <StatusToast type={params.error ? 'error' : params.saved ? 'success' : undefined} message={params.error || (params.saved ? 'Tool modules saved and the public Services page refreshed.' : undefined)} />
            <header><p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-500">Commerce / Services</p><h1 className="mt-2 text-3xl font-black">Service tools</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Each tool is an independent CMS module. Change its name, icon and internal route, reorder it, hide it, or control whether it is active and clickable.</p></header>
            <ServiceToolsEditor initialTools={tools} action={updateServiceTools} />
        </div>
    );
}
