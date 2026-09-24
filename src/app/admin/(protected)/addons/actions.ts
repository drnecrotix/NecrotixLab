'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BUNDLED_ADDONS, isBundledAddonId } from '@/modules/addons/catalog';
import { normalizeServiceToolsConfig, SERVICE_TOOLS_CONFIG_SLUG } from '@/modules/service-tools/settings';

export async function setAddonState(form: FormData) {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) throw new Error('Forbidden');
    const id = String(form.get('id') ?? '');
    if (!isBundledAddonId(id)) throw new Error('Unknown bundled add-on.');
    const enabled = form.get('enabled') === 'true';
    const current = await prisma.page.findUnique({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, select: { content: true } });
    const config = normalizeServiceToolsConfig(current?.content);
    const tool = config.tools.find((item) => item.id === id);
    if (!tool || tool.comingSoon) throw new Error('This add-on is not included in this build.');
    tool.enabled = enabled;
    tool.visible = enabled;
    await prisma.page.upsert({
        where: { slug: SERVICE_TOOLS_CONFIG_SLUG },
        create: { slug: SERVICE_TOOLS_CONFIG_SLUG, title: 'Service tools configuration', status: 'DRAFT', content: config },
        update: { content: config },
    });
    for (const path of ['/admin', '/admin/addons', '/admin/service-tools', '/tools', '/services', ...BUNDLED_ADDONS.map((addon) => addon.href)]) revalidatePath(path);
    redirect('/admin/addons');
}
