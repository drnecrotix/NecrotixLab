import { createHmac, timingSafeEqual } from 'node:crypto';

const hosts: Record<string, string> = {
    'facebook.com': 'Facebook', 'fb.watch': 'Facebook', 'instagram.com': 'Instagram', 'x.com': 'X', 'twitter.com': 'X',
};
export function parseSocialVideoUrl(value: string) {
    if (value.length > 2048) throw new Error('URL is too long.');
    let url: URL;
    try { url = new URL(value); } catch { throw new Error('Enter a valid video URL.'); }
    if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('Use a public HTTPS video URL.');
    const hostname = url.hostname.toLowerCase().replace(/^www\.|^m\.|^mobile\./, '');
    const platform = hosts[hostname];
    if (!platform) throw new Error('Only Facebook, Instagram and X links are supported.');
    if (url.pathname === '/' || url.pathname.length < 2) throw new Error('Link directly to a public video post.');
    url.hash = '';
    return { url: url.toString(), platform };
}
export type DownloadToken = { url: string; formatId: string; title: string; expires: number };
export function signDownloadToken(data: DownloadToken, secret: string) {
    const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
    const signature = createHmac('sha256', secret).update(payload).digest('base64url');
    return `${payload}.${signature}`;
}
export function verifyDownloadToken(token: string, secret: string): DownloadToken {
    const [payload, signature] = token.split('.');
    if (!payload || !signature || token.length > 4000) throw new Error('Invalid download link.');
    const expected = createHmac('sha256', secret).update(payload).digest();
    const provided = Buffer.from(signature, 'base64url');
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) throw new Error('Invalid download link.');
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as DownloadToken;
    if (!Number.isFinite(parsed.expires) || parsed.expires < Date.now() || parsed.expires > Date.now() + 10 * 60_000) throw new Error('Download link expired. Inspect the video again.');
    parseSocialVideoUrl(parsed.url);
    if (typeof parsed.formatId !== 'string' || !/^[a-zA-Z0-9_-]{1,32}$/.test(parsed.formatId)) throw new Error('Invalid video format.');
    if (typeof parsed.title !== 'string' || parsed.title.length > 180) throw new Error('Invalid video title.');
    return parsed;
}
export function summarizeVideoInfo(input: unknown) {
    if (!input || typeof input !== 'object') throw new Error('No public video data was found.');
    const info = input as Record<string, unknown>;
    const formats = Array.isArray(info.formats) ? info.formats : [];
    const candidates = formats.filter((entry): entry is Record<string, unknown> => entry !== null && typeof entry === 'object')
        .filter((format) => format.ext === 'mp4' && typeof format.format_id === 'string' && /^[a-zA-Z0-9_-]{1,32}$/.test(format.format_id) && format.vcodec !== 'none' && format.acodec !== 'none' && ['http', 'https'].includes(String(format.protocol)));
    const sorted = candidates.sort((a, b) => Number(b.height || 0) - Number(a.height || 0) || Number(b.tbr || 0) - Number(a.tbr || 0));
    const unique = sorted.filter((format, index) => sorted.findIndex((item) => Number(item.height || 0) === Number(format.height || 0)) === index).slice(0, 8);
    if (!unique.length) throw new Error('No directly downloadable MP4 with audio was found for this public post.');
    return {
        title: typeof info.title === 'string' ? info.title.slice(0, 180) : 'Social video',
        duration: typeof info.duration === 'number' && Number.isFinite(info.duration) ? info.duration : null,
        uploader: typeof info.uploader === 'string' ? info.uploader.slice(0, 100) : null,
        thumbnail: typeof info.thumbnail === 'string' && info.thumbnail.startsWith('https://') ? info.thumbnail : null,
        formats: unique.map((format) => ({ id: String(format.format_id), height: Number(format.height || 0), width: Number(format.width || 0), size: Number(format.filesize || format.filesize_approx || 0) || null })),
    };
}
export function safeFilename(title: string) { return (title.normalize('NFKD').replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/\s+/g, '-').slice(0, 70) || 'social-video') + '.mp4'; }
