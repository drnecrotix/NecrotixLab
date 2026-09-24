import 'server-only';

export type MarketplaceAddon = { id: string; name: string; version: string; description: string; directory: string; requiresCms: string };
const configuredRepo = process.env.ADDONS_GITHUB_REPOSITORY || 'drnecrotix/NecrotixLab';
export const catalogueRepo = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(configuredRepo) ? configuredRepo : 'drnecrotix/NecrotixLab';
const base = `https://api.github.com/repos/${catalogueRepo}/contents/Addons`;
const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'NecrotixLab-Addon-Catalogue' };

type Entry = { name?: unknown; type?: unknown; content?: unknown; encoding?: unknown };

export async function githubAddonCatalogue(): Promise<{ addons: MarketplaceAddon[]; error?: string }> {
    try {
        const listing = await fetch(`${base}?ref=main`, { headers, cache: 'no-store', signal: AbortSignal.timeout(6000) });
        if (!listing.ok) throw new Error(`GitHub returned ${listing.status}.`);
        const entries: unknown = await listing.json();
        if (!Array.isArray(entries)) throw new Error('Invalid GitHub catalogue.');
        const directories = (entries as Entry[]).filter((entry) => entry.type === 'dir' && typeof entry.name === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(entry.name)).slice(0, 30);
        const addons = await Promise.all(directories.map(async (entry) => {
            const directory = entry.name as string;
            try {
                const response = await fetch(`${base}/${encodeURIComponent(directory)}/manifest.json?ref=main`, { headers, cache: 'no-store', signal: AbortSignal.timeout(6000) });
                if (!response.ok) return null;
                const file = await response.json() as Entry;
                if (file.encoding !== 'base64' || typeof file.content !== 'string' || file.content.length > 32768) return null;
                const manifest: unknown = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
                if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) return null;
                const data = manifest as Record<string, unknown>;
                if (data.format !== 'necrotixlab-addon-v1' || typeof data.id !== 'string' || !/^[a-z0-9-]{1,64}$/.test(data.id) || typeof data.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(data.version)) return null;
                return { id: data.id, name: String(data.name || directory).slice(0, 80), version: data.version, description: String(data.description || '').slice(0, 240), requiresCms: String(data.requiresCms || ''), directory };
            } catch { return null; }
        }));
        return { addons: addons.filter((item): item is MarketplaceAddon => item !== null) };
    } catch (error) {
        return { addons: [], error: error instanceof Error ? error.message : 'GitHub catalogue unavailable.' };
    }
}
