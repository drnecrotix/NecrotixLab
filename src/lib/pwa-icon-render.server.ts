import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { getPwaSettings } from '@/lib/pwa-settings.server';
import { PWA_ICON_512, type PwaIconKind, staticIconForKind } from '@/lib/pwa-icons';

const PUBLIC_ROOT = path.resolve(process.cwd(), 'public');

function publicPath(rel: string) {
    const decoded = decodeURIComponent(rel.split('?')[0] || '');
    if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('\0') || decoded.includes('..')) {
        return null;
    }
    const full = path.resolve(PUBLIC_ROOT, decoded.slice(1));
    if (!full.startsWith(PUBLIC_ROOT + path.sep) && full !== PUBLIC_ROOT) return null;
    return full;
}

function hostBlocked(hostname: string) {
    const host = hostname.toLowerCase();
    return host === 'localhost' || host.endsWith('.localhost') || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1'
        || host.startsWith('10.') || host.startsWith('192.168.') || host.startsWith('169.254.') || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
}

async function readPublic(rel: string) {
    const file = publicPath(rel);
    if (!file) return null;
    try {
        return await readFile(file);
    } catch {
        return null;
    }
}

async function fetchHttps(url: string) {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:' || hostBlocked(parsed.hostname)) return null;
        const response = await fetch(parsed, { signal: AbortSignal.timeout(8000), redirect: 'error' });
        if (!response.ok) return null;
        const type = response.headers.get('content-type') || '';
        if (!type.startsWith('image/')) return null;
        return Buffer.from(await response.arrayBuffer());
    } catch {
        return null;
    }
}

async function loadSource(src: string) {
    if (!src) return null;
    if (src.startsWith('/') && !src.startsWith('//')) return readPublic(src);
    if (src.startsWith('https://')) return fetchHttps(src);
    return null;
}

export async function sourceIconBuffer() {
    const settings = await getPwaSettings();
    const candidates = [
        settings.iconUrl,
        settings.icon512Url,
        settings.icon192Url,
        settings.appleIconUrl,
        PWA_ICON_512,
        '/dr-necrotix-mark.svg',
        '/favicon.svg',
    ];
    for (const candidate of candidates) {
        const buffer = await loadSource(candidate);
        if (buffer?.length) return { buffer, background: settings.backgroundColor, theme: settings.themeColor };
    }
    return { buffer: null, background: '#0c0a12', theme: '#0c0a12' };
}

function iconSize(kind: PwaIconKind) {
    if (kind === '96') return 96;
    if (kind === '180') return 180;
    if (kind === '192' || kind === '192-maskable') return 192;
    return 512;
}

export async function renderPwaIcon(kind: PwaIconKind) {
    const size = iconSize(kind);
    const maskable = kind.endsWith('maskable');
    const { buffer, background } = await sourceIconBuffer();
    if (!buffer) return readPublic(staticIconForKind(kind));

    try {
        const inner = maskable ? Math.round(size * 0.76) : size;
        const prepared = sharp(buffer, { failOn: 'none' }).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
        const glyph = kind === 'monochrome'
            ? await prepared.grayscale().png().toBuffer()
            : await prepared.png().toBuffer();

        if (kind === 'monochrome') {
            return sharp(glyph).resize(size, size).png().toBuffer();
        }

        const canvas = sharp({
            create: {
                width: size,
                height: size,
                channels: 4,
                background: background || '#0c0a12',
            },
        });
        return canvas.composite([{ input: glyph, gravity: 'centre' }]).png().toBuffer();
    } catch {
        return readPublic(staticIconForKind(kind));
    }
}

export async function renderAppleSplash(width: number, height: number) {
    const { buffer, background } = await sourceIconBuffer();
    const fill = background || '#0c0a12';
    const iconSizePx = Math.round(Math.min(width, height) * 0.22);
    const fallback = await readPublic(PWA_ICON_512);
    const source = buffer || fallback;
    const canvas = sharp({
        create: { width, height, channels: 3, background: fill },
    });
    if (!source) return canvas.png().toBuffer();
    try {
        const icon = await sharp(source, { failOn: 'none' })
            .resize(iconSizePx, iconSizePx, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();
        return canvas.composite([{ input: icon, gravity: 'centre' }]).png().toBuffer();
    } catch {
        return canvas.png().toBuffer();
    }
}
