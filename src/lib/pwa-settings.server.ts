import { prisma } from '@/lib/prisma';
import { PWA_CONFIG_SLUG, defaultPwaSettings, normalizePwaSettings, type PwaSettings } from '@/lib/pwa-settings';

export async function getPwaSettings(): Promise<PwaSettings> {
    try {
        const page = await prisma.page.findUnique({
            where: { slug: PWA_CONFIG_SLUG },
            select: { content: true, updatedAt: true },
        });
        const settings = normalizePwaSettings(page?.content);
        // Existing installations predate iconRevision. Give their current logo
        // a revision immediately, without requiring another settings save.
        if (!settings.iconRevision && page) settings.iconRevision = page.updatedAt.getTime().toString(36);
        return settings;
    } catch {
        return defaultPwaSettings;
    }
}
