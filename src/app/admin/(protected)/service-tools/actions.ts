'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { normalizeServiceToolsConfig, SERVICE_TOOLS_CONFIG_SLUG, SERVICE_TOOLS_CONFIG_VERSION } from '@/modules/service-tools/settings';

export async function updateServiceTools(form: FormData) {
    let destination = '/admin/service-tools?saved=1';
    try {
        const session = await auth();
        if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) throw new Error('Forbidden');
        const raw = JSON.parse(String(form.get('tools') ?? '[]')) as unknown;
        const tools = normalizeServiceToolsConfig({ version: SERVICE_TOOLS_CONFIG_VERSION, tools: raw });
        await prisma.page.upsert({
            where: { slug: SERVICE_TOOLS_CONFIG_SLUG },
            create: { slug: SERVICE_TOOLS_CONFIG_SLUG, title: 'Service tools configuration', status: 'DRAFT', content: tools },
            update: { content: tools },
        });
        revalidatePath('/services');
        revalidatePath('/admin/service-tools');
    } catch (error) {
        destination = `/admin/service-tools?error=${encodeURIComponent(error instanceof Error ? error.message : 'Unable to save service tools.')}`;
    }
    redirect(destination);
}
