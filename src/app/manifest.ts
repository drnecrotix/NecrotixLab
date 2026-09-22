import type { MetadataRoute } from 'next';
import { defaultPwaSettings, pwaSettingsToManifest } from '@/lib/pwa-settings';
import { getPwaSettings } from '@/lib/pwa-settings.server';

// CMS changes must never leave a build-time manifest snapshot behind.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    try {
        return pwaSettingsToManifest(await getPwaSettings()) as MetadataRoute.Manifest;
    } catch {
        return pwaSettingsToManifest(defaultPwaSettings) as MetadataRoute.Manifest;
    }
}
