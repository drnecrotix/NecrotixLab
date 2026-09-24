import { unzipSync } from 'fflate';

export const MAX_ADDON_ZIP_BYTES = 2 * 1024 * 1024;
export type AddonManifest = { format: 'necrotixlab-addon-v1'; id: string; name: string; version: string; requiresCms: string; description: string; directory: string };

export function parseAddonZip(data: Uint8Array): AddonManifest {
    if (!data.length || data.length > MAX_ADDON_ZIP_BYTES) throw new Error('Plugin ZIP must be no larger than 2 MB.');
    let entries = 0;
    const manifests = unzipSync(data, { filter: (entry) => {
        if (++entries > 256) throw new Error('Plugin ZIP has too many files.');
        return /^Addons\/[A-Za-z0-9_-]{1,64}\/manifest\.json$/.test(entry.name) && entry.originalSize <= 16384;
    } });
    const paths = Object.keys(manifests);
    if (paths.length !== 1) throw new Error('ZIP must contain exactly one Addons/<Name>/manifest.json.');
    const dataObject: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(manifests[paths[0]!]));
    if (!dataObject || typeof dataObject !== 'object' || Array.isArray(dataObject)) throw new Error('Invalid plugin manifest.');
    const item = dataObject as Record<string, unknown>;
    if (item.format !== 'necrotixlab-addon-v1' || typeof item.id !== 'string' || !/^[a-z0-9-]{1,64}$/.test(item.id)
        || typeof item.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(item.version)
        || typeof item.requiresCms !== 'string' || !/^\d+\.\d+\.\d+$/.test(item.requiresCms)
        || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 80
        || typeof item.description !== 'string' || item.description.length > 240) throw new Error('Plugin manifest has invalid fields.');
    return { format: 'necrotixlab-addon-v1', id: item.id, name: item.name.trim(), version: item.version, requiresCms: item.requiresCms, description: item.description, directory: paths[0]!.split('/')[1]! };
}

export function compareVersions(a: string, b: string) {
    const left = a.split('.').map(Number);
    const right = b.split('.').map(Number);
    for (let index = 0; index < 3; index++) {
        if ((left[index] || 0) !== (right[index] || 0)) return (left[index] || 0) - (right[index] || 0);
    }
    return 0;
}
