import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { getPwaSettings } from '@/lib/pwa-settings.server';
import { isGeneratedIconPath, type PwaSplashStyle } from '@/lib/pwa-settings';
import { PWA_ICON_512, type PwaIconKind, staticIconForKind } from '@/lib/pwa-icons';
import { readMediaFile } from '@/lib/media-storage';

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
    if (!src || isGeneratedIconPath(src)) return null;
    if (src.startsWith('/') && !src.startsWith('//')) {
        const key = decodeURIComponent(src.split('?')[0] || '').replace(/^\//, '');
        if (key.startsWith('uploads/') || key.startsWith('media/')) {
            try {
                const managed = await readMediaFile(key);
                if (managed?.length) return managed;
            } catch {
                // Fall through to the public folder, then fail closed.
            }
        }
        return readPublic(src);
    }
    if (src.startsWith('https://')) return fetchHttps(src);
    return null;
}

export async function sourceIconBuffer() {
    const settings = await getPwaSettings();
    const candidates = [
        settings.iconUrl,
        settings.iconAutoPack ? '' : settings.icon512Url,
        settings.iconAutoPack ? '' : settings.icon192Url,
        PWA_ICON_512,
        '/dr-necrotix-mark.svg',
        '/favicon.svg',
    ];
    for (const candidate of candidates) {
        const buffer = await loadSource(candidate);
        if (buffer?.length) return { buffer, settings };
    }
    return { buffer: null, settings };
}

function iconSize(kind: PwaIconKind) {
    if (kind === '96') return 96;
    if (kind === '180') return 180;
    if (kind === '192' || kind === '192-maskable') return 192;
    return 512;
}

function isDarkHex(hex: string) {
    const n = Number.parseInt(hex.slice(1), 16);
    if (!Number.isFinite(n)) return true;
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

export async function renderPwaIcon(kind: PwaIconKind) {
    const size = iconSize(kind);
    const maskable = kind.endsWith('maskable');
    const { buffer, settings } = await sourceIconBuffer();
    const background = settings.backgroundColor || '#0c0a12';
    if (!buffer) return readPublic(staticIconForKind(kind));

    try {
        const inner = maskable ? Math.round(size * 0.72) : Math.round(size * 0.86);
        const prepared = sharp(buffer, { failOn: 'none' }).resize(inner, inner, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        });

        if (kind === 'monochrome') {
            const glyph = await prepared.grayscale().normalize().png().toBuffer();
            return sharp(glyph).resize(size, size).png().toBuffer();
        }

        const glyph = await prepared.png().toBuffer();
        const canvas = sharp({
            create: {
                width: size,
                height: size,
                channels: 4,
                background,
            },
        });
        return canvas.composite([{ input: glyph, gravity: 'centre' }]).png().toBuffer();
    } catch {
        return readPublic(staticIconForKind(kind));
    }
}

function wordmarkSvg(label: string, width: number, fill: string, fontSize: number) {
    const escaped = label
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"');
    const height = Math.round(fontSize * 1.6);
    return Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" fill="${fill}">${escaped}</text></svg>`,
    );
}

export async function renderAppleSplash(width: number, height: number) {
    const { buffer, settings } = await sourceIconBuffer();
    const fill = settings.backgroundColor || '#0c0a12';
    const ink = isDarkHex(fill) ? '#f4f0ea' : '#16141c';
    const style: PwaSplashStyle = settings.splashStyle;
    const canvas = sharp({
        create: { width, height, channels: 3, background: fill },
    });

    if (style === 'solid') return canvas.png().toBuffer();

    if (style === 'image' && settings.splashImageUrl) {
        const photo = await loadSource(settings.splashImageUrl);
        if (photo?.length) {
            try {
                const cover = await sharp(photo, { failOn: 'none' })
                    .resize(width, height, { fit: 'cover' })
                    .png()
                    .toBuffer();
                return sharp(cover).png().toBuffer();
            } catch {
                // Fall through to the logo splash.
            }
        }
    }

    const layers: sharp.OverlayOptions[] = [];
    const showIcon = style === 'logo' || style === 'logo-name' || style === 'image';
    const showName = style === 'logo-name' || style === 'wordmark';
    const minSide = Math.min(width, height);

    if (showIcon) {
        const fallback = await readPublic(PWA_ICON_512);
        const source = buffer || fallback;
        if (source) {
            try {
                const iconSizePx = Math.round(minSide * (style === 'logo' ? 0.28 : 0.2));
                const icon = await sharp(source, { failOn: 'none' })
                    .resize(iconSizePx, iconSizePx, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                    .png()
                    .toBuffer();
                layers.push({ input: icon, gravity: 'centre' });
            } catch {
                // Keep a solid splash if compositing fails.
            }
        }
    }

    if (showName) {
        const fontSize = Math.max(28, Math.round(minSide * 0.045));
        const label = (settings.shortName || settings.name).slice(0, 24);
        const svg = wordmarkSvg(label, Math.round(width * 0.8), ink, fontSize);
        const top = showIcon
            ? Math.round(height / 2 + minSide * 0.16)
            : Math.round(height / 2 - fontSize);
        layers.push({ input: svg, top, left: Math.round(width * 0.1) });
        if (settings.splashTagline) {
            const sub = wordmarkSvg(settings.splashTagline.slice(0, 40), Math.round(width * 0.8), ink, Math.round(fontSize * 0.48));
            layers.push({ input: sub, top: top + Math.round(fontSize * 1.7), left: Math.round(width * 0.1) });
        }
    }

    if (!layers.length) return canvas.png().toBuffer();
    try {
        return canvas.composite(layers).png().toBuffer();
    } catch {
        return canvas.png().toBuffer();
    }
}

export type { PwaSettings };
