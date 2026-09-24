'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { normalizeServiceToolsConfig, SERVICE_TOOLS_CONFIG_SLUG, SERVICE_TOOLS_CONFIG_VERSION } from '@addons/Tools/settings';

export async function updateServiceTools(form: FormData) {
    let destination = '/admin/addons?saved=1#tools-settings';
    try {
        const session = await auth();
        if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) throw new Error('Forbidden');
        const raw = JSON.parse(String(form.get('tools') ?? '[]')) as unknown;
        const current = await prisma.page.findUnique({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, select: { content: true } });
        const previous = normalizeServiceToolsConfig(current?.content);
        if (!previous.installed) throw new Error('Install the Tools package first.');
        const tools = normalizeServiceToolsConfig({ version: SERVICE_TOOLS_CONFIG_VERSION, tools: raw, installed: previous.installed, active: previous.active, packageVersion: previous.packageVersion });
        await prisma.page.upsert({
            where: { slug: SERVICE_TOOLS_CONFIG_SLUG },
            create: { slug: SERVICE_TOOLS_CONFIG_SLUG, title: 'Service tools configuration', status: 'DRAFT', content: tools },
            update: { content: tools },
        });
        revalidatePath('/services');
        revalidatePath('/admin/service-tools');
        revalidatePath('/admin/addons');
        revalidatePath('/tools');
    } catch (error) {
        destination = `/admin/addons?error=${encodeURIComponent(error instanceof Error ? error.message : 'Unable to save tool settings.')}`;
    }
    redirect(destination);
}
