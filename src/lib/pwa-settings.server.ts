import { prisma } from '@/lib/prisma';
import { PWA_CONFIG_SLUG, defaultPwaSettings, normalizePwaSettings, type PwaSettings } from '@/lib/pwa-settings';

export async function getPwaSettings(): Promise<PwaSettings> {
    try {
        const page = await prisma.page.findUnique({
            where: { slug: PWA_CONFIG_SLUG },
            select: { content: true },
        });
        return normalizePwaSettings(page?.content);
    } catch {
        return defaultPwaSettings;
    }
}
