import type { MetadataRoute } from 'next';
import { defaultPwaSettings, pwaSettingsToManifest } from '@/lib/pwa-settings';
import { getPwaSettings } from '@/lib/pwa-settings.server';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    try {
        return pwaSettingsToManifest(await getPwaSettings()) as MetadataRoute.Manifest;
    } catch {
        return pwaSettingsToManifest(defaultPwaSettings) as MetadataRoute.Manifest;
    }
}
