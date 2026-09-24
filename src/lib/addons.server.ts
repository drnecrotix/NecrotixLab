import 'server-only';
import { prisma } from '@/lib/prisma';
import { normalizeServiceTools, SERVICE_TOOLS_CONFIG_SLUG, toolsActive } from '@addons/Tools/settings';
import { isBundledAddonId, type BundledAddonId } from '@/modules/addons/catalog';

export async function toolsPackageActive() {
    try {
        const page = await prisma.page.findUnique({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, select: { content: true } });
        return toolsActive(page?.content);
    } catch {
        return false;
    }
}

export async function addonEnabled(id: BundledAddonId) {
    if (!isBundledAddonId(id)) return false;
    try {
        const page = await prisma.page.findUnique({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, select: { content: true } });
        const tool = normalizeServiceTools(page?.content).find((item) => item.id === id);
        return toolsActive(page?.content) && Boolean(tool?.enabled && !tool.comingSoon);
    } catch {
        return false;
    }
}

export async function addonToolEnabled(id: string) {
    try {
        const page = await prisma.page.findUnique({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, select: { content: true } });
        if (!toolsActive(page?.content)) return false;
        const tool = normalizeServiceTools(page?.content).find((item) => item.id === id);
        return Boolean(tool?.enabled && !tool.comingSoon);
    } catch { return false; }
}
