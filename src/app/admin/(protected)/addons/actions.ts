'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { unzipSync } from 'fflate';
import manifest from '@addons/Tools/manifest.json';
import { normalizeServiceToolsConfig, SERVICE_TOOLS_CONFIG_SLUG, TOOLS_ADDON_VERSION } from '@addons/Tools/settings';

async function requireAdmin() {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) throw new Error('Forbidden');
}

function refresh() {
    for (const path of ['/admin', '/admin/addons', '/admin/service-tools', '/tools', '/services']) revalidatePath(path);
}

export async function setToolsAddonState(form: FormData) {
    await requireAdmin();
    const current = await prisma.page.findUnique({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, select: { content: true } });
    const config = normalizeServiceToolsConfig(current?.content);
    const operation = form.get('operation');
    if (operation === 'install' || operation === 'activate') {
        config.installed = true;
        config.active = true;
    } else if (operation === 'deactivate') {
        config.active = false;
    } else if (operation === 'uninstall') {
        config.installed = false;
        config.active = false;
    } else throw new Error('Unknown package operation.');
    await prisma.page.upsert({
        where: { slug: SERVICE_TOOLS_CONFIG_SLUG },
        create: { slug: SERVICE_TOOLS_CONFIG_SLUG, title: 'Tools addon configuration', status: 'DRAFT', content: config },
        update: { content: config },
    });
    refresh();
    redirect('/admin/addons');
}

export async function importToolsAddon(form: FormData) {
    await requireAdmin();
    let destination = '/admin/addons?imported=1';
    try {
        const file = form.get('package');
        if (!(file instanceof File) || file.size > 1048576 || !file.name.endsWith('.zip')) throw new Error('Select a Tools package (.zip, max 1 MB).');
        const files = unzipSync(new Uint8Array(await file.arrayBuffer()), { filter: (entry) => entry.name === 'Addons/Tools/manifest.json' && entry.originalSize <= 32768 });
        const manifestBytes = files['Addons/Tools/manifest.json'];
        if (!manifestBytes) throw new Error('Tools package manifest is missing.');
        const data: unknown = JSON.parse(new TextDecoder().decode(manifestBytes));
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid package.');
        const value = data as Record<string, unknown>;
        if (value.id !== manifest.id || value.format !== manifest.format || value.version !== TOOLS_ADDON_VERSION || value.requiresCms !== manifest.requiresCms) {
            throw new Error(`This CMS build supports only Tools ${TOOLS_ADDON_VERSION}. Deploy a newer CMS build before importing a newer package.`);
        }
        const current = await prisma.page.findUnique({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, select: { content: true } });
        const config = normalizeServiceToolsConfig(current?.content);
        config.installed = true;
        config.active = true;
        config.packageVersion = TOOLS_ADDON_VERSION;
        await prisma.page.upsert({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, create: { slug: SERVICE_TOOLS_CONFIG_SLUG, title: 'Tools addon configuration', status: 'DRAFT', content: config }, update: { content: config } });
        refresh();
    } catch (error) {
        destination = `/admin/addons?error=${encodeURIComponent(error instanceof Error ? error.message : 'Unable to import package.')}`;
    }
    redirect(destination);
}
