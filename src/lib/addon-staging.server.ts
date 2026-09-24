import 'server-only';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { prisma } from '@/lib/prisma';
import { type AddonManifest, compareVersions, parseAddonZip } from '@/modules/addons/package';

export const ADDONS_REGISTRY_SLUG = '__addons-registry';
export type StagedAddon = Pick<AddonManifest, 'id' | 'name' | 'version' | 'requiresCms' | 'description'> & { source: 'github' | 'custom'; directory: string };
const storageRoot = resolve(process.cwd(), 'storage', 'addons');

export function stagedAddons(value: unknown): StagedAddon[] {
    if (!value || typeof value !== 'object' || Array.isArray(value) || !('packages' in value)) return [];
    const packages = (value as { packages: unknown }).packages;
    if (!Array.isArray(packages)) return [];
    return packages.filter((item): item is StagedAddon => Boolean(item && typeof item === 'object' && /^[a-z0-9-]{1,64}$/.test(item.id) && /^\d+\.\d+\.\d+$/.test(item.version) && ['github', 'custom'].includes(item.source))).slice(0, 30);
}

function archivePath(id: string) {
    if (!/^[a-z0-9-]{1,64}$/.test(id)) throw new Error('Invalid addon ID.');
    return join(storageRoot, id, 'package.zip');
}

export async function stageAddonZip(bytes: Uint8Array, source: StagedAddon['source']) {
    const manifest = parseAddonZip(bytes);
    if (manifest.id === 'tools') throw new Error('Tools is included in this CMS build. Use its compatible package installer.');
    const current = await prisma.page.findUnique({ where: { slug: ADDONS_REGISTRY_SLUG }, select: { content: true } });
    const packages = stagedAddons(current?.content);
    const previous = packages.find((item) => item.id === manifest.id);
    if (previous && compareVersions(manifest.version, previous.version) < 0) throw new Error('An older plugin version cannot replace a newer staged package.');
    if (packages.length >= 30 && !previous) throw new Error('Maximum of 30 staged plugins reached.');
    const entry: StagedAddon = { id: manifest.id, name: manifest.name, version: manifest.version, requiresCms: manifest.requiresCms, description: manifest.description, directory: manifest.directory, source };
    const target = archivePath(manifest.id);
    await mkdir(join(storageRoot, manifest.id), { recursive: true });
    const temporary = `${target}.${crypto.randomUUID()}.tmp`;
    try {
        await writeFile(temporary, bytes, { flag: 'wx', mode: 0o600 });
        await rename(temporary, target);
        await prisma.page.upsert({ where: { slug: ADDONS_REGISTRY_SLUG }, create: { slug: ADDONS_REGISTRY_SLUG, title: 'Staged addons', status: 'DRAFT', content: { packages: [...packages.filter((item) => item.id !== entry.id), entry] } }, update: { content: { packages: [...packages.filter((item) => item.id !== entry.id), entry] } } });
    } finally { await rm(temporary, { force: true }); }
    return entry;
}

export async function deleteStagedAddon(id: string) {
    const current = await prisma.page.findUnique({ where: { slug: ADDONS_REGISTRY_SLUG }, select: { content: true } });
    const packages = stagedAddons(current?.content);
    if (!packages.some((item) => item.id === id)) throw new Error('Plugin not found.');
    await prisma.page.update({ where: { slug: ADDONS_REGISTRY_SLUG }, data: { content: { packages: packages.filter((item) => item.id !== id) } } });
    await rm(join(storageRoot, id), { recursive: true, force: true });
}

export async function readStagedAddon(id: string) {
    const current = await prisma.page.findUnique({ where: { slug: ADDONS_REGISTRY_SLUG }, select: { content: true } });
    const entry = stagedAddons(current?.content).find((item) => item.id === id);
    if (!entry) return null;
    const bytes = await readFile(archivePath(id));
    return { entry, bytes };
}
