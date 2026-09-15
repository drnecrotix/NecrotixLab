'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { PWA_CONFIG_SLUG, normalizePwaSettings, type PwaSettings } from '@/lib/pwa-settings';
import { safeCmsMediaUrl } from '@/lib/sanitize-cms-html';

export type PwaSaveResult = {
    ok: boolean;
    message: string;
    savedAt?: string;
    settings?: PwaSettings;
};

async function requireAdministrator() {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) {
        throw new Error('Forbidden');
    }
}

function jsonField(form: FormData, key: string) {
    const raw = String(form.get(key) ?? '').trim();
    if (!raw) return undefined;
    try {
        return JSON.parse(raw) as unknown;
    } catch {
        throw new Error(`${key} is not valid JSON.`);
    }
}

export async function savePwaSettings(form: FormData): Promise<PwaSaveResult> {
    try {
        await requireAdministrator();

        const settings = normalizePwaSettings({
            name: form.get('name'),
            shortName: form.get('shortName'),
            description: form.get('description'),
            startUrl: form.get('startUrl'),
            scope: form.get('scope'),
            id: form.get('id'),
            lang: form.get('lang'),
            display: form.get('display'),
            orientation: form.get('orientation'),
            backgroundColor: form.get('backgroundColor'),
            themeColor: form.get('themeColor'),
            themeColorLight: form.get('themeColorLight'),
            iconUrl: safeCmsMediaUrl(form.get('iconUrl')),
            icon192Url: safeCmsMediaUrl(form.get('icon192Url')),
            icon512Url: safeCmsMediaUrl(form.get('icon512Url')),
            appleIconUrl: safeCmsMediaUrl(form.get('appleIconUrl')),
            maskableIconUrl: safeCmsMediaUrl(form.get('maskableIconUrl')),
            monochromeIconUrl: safeCmsMediaUrl(form.get('monochromeIconUrl')),
            screenshotNarrowUrl: safeCmsMediaUrl(form.get('screenshotNarrowUrl')),
            screenshotWideUrl: safeCmsMediaUrl(form.get('screenshotWideUrl')),
            categories: jsonField(form, 'categories'),
            handleLinks: form.get('handleLinks'),
            launchHandler: form.get('launchHandler'),
            displayOverrideWco: form.get('displayOverrideWco') === 'on',
            shareTargetEnabled: form.get('shareTargetEnabled') === 'on',
            statusBarStyle: form.get('statusBarStyle'),
            nativeChrome: form.get('nativeChrome') === 'on',
            tabBarStyle: form.get('tabBarStyle'),
            hideSiteChrome: form.get('hideSiteChrome') === 'on',
            showInstallPrompt: form.get('showInstallPrompt') === 'on',
            showIosInstallHint: form.get('showIosInstallHint') === 'on',
            splashEnabled: form.get('splashEnabled') === 'on',
            serviceWorkerEnabled: form.get('serviceWorkerEnabled') === 'on',
            offlineFallbackEnabled: form.get('offlineFallbackEnabled') === 'on',
            pullToRefresh: form.get('pullToRefresh') === 'on',
            updatePromptEnabled: form.get('updatePromptEnabled') === 'on',
            offlineBannerEnabled: form.get('offlineBannerEnabled') === 'on',
            appBadgeEnabled: form.get('appBadgeEnabled') === 'on',
            tabs: jsonField(form, 'tabs'),
            shortcuts: jsonField(form, 'shortcuts'),
        });

        const saved = await prisma.page.upsert({
            where: { slug: PWA_CONFIG_SLUG },
            update: {
                title: 'PWA configuration',
                status: 'DRAFT',
                content: settings as unknown as Prisma.InputJsonValue,
            },
            create: {
                slug: PWA_CONFIG_SLUG,
                title: 'PWA configuration',
                status: 'DRAFT',
                content: settings as unknown as Prisma.InputJsonValue,
            },
            select: { updatedAt: true },
        });

        revalidatePath('/', 'layout');
        revalidatePath('/manifest.webmanifest');
        revalidatePath('/admin/pwa');
        revalidatePath('/pwa/icon/192');
        revalidatePath('/pwa/icon/512');
        revalidatePath('/api/pwa/badge');

        return {
            ok: true,
            message: 'PWA settings saved. Installed apps pick this up on the next launch.',
            savedAt: saved.updatedAt.toISOString(),
            settings,
        };
    } catch (error) {
        return {
            ok: false,
            message: error instanceof Error ? error.message : 'PWA settings could not be saved.',
        };
    }
}
