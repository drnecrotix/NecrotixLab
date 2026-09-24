'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { catalogueRepo, githubAddonCatalogue } from '@/lib/addon-marketplace.server';
import { deleteStagedAddon, stageAddonZip } from '@/lib/addon-staging.server';
import { MAX_ADDON_ZIP_BYTES, parseAddonZip } from '@/modules/addons/package';
import manifest from '@addons/Tools/manifest.json';
import { normalizeServiceToolsConfig, SERVICE_TOOLS_CONFIG_SLUG, TOOLS_ADDON_VERSION } from '@addons/Tools/settings';

async function requireAdmin() {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) throw new Error('Forbidden');
}

function refresh() {
    for (const path of ['/admin', '/admin/addons', '/admin/service-tools', '/tools', '/services', '/lab']) revalidatePath(path);
}

async function activateTools() {
    const current = await prisma.page.findUnique({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, select: { content: true } });
    const config = normalizeServiceToolsConfig(current?.content);
    config.installed = true;
    config.active = true;
    config.packageVersion = TOOLS_ADDON_VERSION;
    await prisma.page.upsert({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, create: { slug: SERVICE_TOOLS_CONFIG_SLUG, title: 'Tools addon configuration', status: 'DRAFT', content: config }, update: { content: config } });
    refresh();
}

async function installArchive(bytes: Uint8Array, source: 'github' | 'custom') {
    const item = parseAddonZip(bytes);
    if (item.id === 'tools') {
        if (item.directory !== 'Tools' || item.version !== manifest.version || item.requiresCms !== manifest.requiresCms) throw new Error(`Tools ${item.version} needs a matching CMS build. This build supports ${TOOLS_ADDON_VERSION}.`);
        await activateTools();
    } else {
        await stageAddonZip(bytes, source);
        revalidatePath('/admin/addons');
    }
    return item.id;
}

export async function setToolsAddonState(form: FormData) {
    await requireAdmin();
    const current = await prisma.page.findUnique({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, select: { content: true } });
    const config = normalizeServiceToolsConfig(current?.content);
    const operation = form.get('operation');
    if (operation === 'install' || operation === 'activate') { config.installed = true; config.active = true; }
    else if (operation === 'update') {
        if (!config.installed) throw new Error('Install Tools before updating.');
        config.packageVersion = TOOLS_ADDON_VERSION;
    }
    else if (operation === 'deactivate') config.active = false;
    else if (operation === 'uninstall') { config.installed = false; config.active = false; }
    else throw new Error('Unknown package operation.');
    await prisma.page.upsert({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, create: { slug: SERVICE_TOOLS_CONFIG_SLUG, title: 'Tools addon configuration', status: 'DRAFT', content: config }, update: { content: config } });
    refresh();
    redirect(`/admin/addons?tab=installed&saved=${operation === 'update' ? 'updated' : 'state'}`);
}

export async function uploadAddon(form: FormData) {
    await requireAdmin();
    let destination = '/admin/addons?tab=installed&imported=1';
    try {
        const file = form.get('package');
        if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.zip') || file.size > MAX_ADDON_ZIP_BYTES) throw new Error('Select a plugin ZIP no larger than 2 MB.');
        await installArchive(new Uint8Array(await file.arrayBuffer()), 'custom');
    } catch (error) { destination = `/admin/addons?tab=add-new&error=${encodeURIComponent(error instanceof Error ? error.message : 'Unable to import plugin.')}`; }
    redirect(destination);
}

export async function installGithubAddon(form: FormData) {
    await requireAdmin();
    let destination = '/admin/addons?tab=installed&imported=1';
    try {
        const id = String(form.get('id') ?? '');
        const catalogue = await githubAddonCatalogue(true);
        const item = catalogue.addons.find((addon) => addon.id === id);
        if (!item) throw new Error('Plugin was not found in the official GitHub catalogue.');
        const archive = `necrotixlab-${item.id}-${item.version}.zip`;
        const url = `https://raw.githubusercontent.com/${catalogueRepo}/main/Addons/${encodeURIComponent(item.directory)}/${archive}`;
        const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'NecrotixLab-Addon-Installer' } });
        if (!response.ok) throw new Error(`GitHub package download failed (${response.status}).`);
        if (Number(response.headers.get('content-length') || 0) > MAX_ADDON_ZIP_BYTES) throw new Error('GitHub plugin ZIP exceeds 2 MB.');
        if (!response.body) throw new Error('GitHub returned an empty package.');
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let size = 0;
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                size += value.byteLength;
                if (size > MAX_ADDON_ZIP_BYTES) throw new Error('GitHub plugin ZIP exceeds 2 MB.');
                chunks.push(value);
            }
        } finally { reader.releaseLock(); }
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
        const downloaded = parseAddonZip(bytes);
        if (downloaded.id !== item.id || downloaded.version !== item.version || downloaded.directory !== item.directory) throw new Error('GitHub package does not match its published manifest.');
        await installArchive(bytes, 'github');
    } catch (error) { destination = `/admin/addons?tab=available&error=${encodeURIComponent(error instanceof Error ? error.message : 'Unable to install GitHub plugin.')}`; }
    redirect(destination);
}

export async function removeStagedAddon(form: FormData) {
    await requireAdmin();
    const id = String(form.get('id') ?? '');
    await deleteStagedAddon(id);
    revalidatePath('/admin/addons');
    redirect('/admin/addons?tab=installed');
}
