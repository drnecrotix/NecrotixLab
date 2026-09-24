import 'server-only';
import { prisma } from '@/lib/prisma';
import { normalizeServiceTools, SERVICE_TOOLS_CONFIG_SLUG } from '@/modules/service-tools/settings';
import { isBundledAddonId, type BundledAddonId } from '@/modules/addons/catalog';

export async function addonEnabled(id: BundledAddonId) {
    if (!isBundledAddonId(id)) return false;
    try {
        const page = await prisma.page.findUnique({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, select: { content: true } });
        const tool = normalizeServiceTools(page?.content).find((item) => item.id === id);
        return Boolean(tool?.enabled && !tool.comingSoon);
    } catch {
        return false;
    }
}
