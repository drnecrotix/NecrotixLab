type Variant = { id: string; url: string; width: number; height: number; size: null };
type RecordValue = Record<string, unknown>;
const object = (value: unknown): RecordValue => value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {};

export function safeThreadsMediaUrl(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && !url.port && !url.username && !url.password && /(^|\.)cdninstagram\.com$/.test(url.hostname) && url.pathname.endsWith('.mp4') ? url.toString() : null;
    } catch { return null; }
}

export function parseThreadsVideo(html: string, code: string) {
    const posts: RecordValue[] = [];
    function visit(value: unknown, depth = 0) {
        if (depth > 35) return;
        if (Array.isArray(value)) { value.forEach((entry) => visit(entry, depth + 1)); return; }
        if (!value || typeof value !== 'object') return;
        const item = value as RecordValue;
        if (item.code === code && (item.video_versions || item.carousel_media)) posts.push(item);
        Object.values(item).forEach((entry) => visit(entry, depth + 1));
    }
    for (const match of html.matchAll(/<script\b[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
        try { visit(JSON.parse(match[1])); } catch { /* Other scripts can be unrelated. */ }
    }
    const post = posts[0];
    if (!post) throw new Error('This Threads post is private, unavailable, or its public video data could not be found.');
    const media = [post, ...(Array.isArray(post.carousel_media) ? post.carousel_media.map(object) : [])];
    const formats: Variant[] = [];
    for (const item of media) for (const version of Array.isArray(item.video_versions) ? item.video_versions : []) {
        const video = object(version), url = safeThreadsMediaUrl(video.url);
        if (!url || formats.some((entry) => new URL(entry.url).pathname === new URL(url).pathname)) continue;
        formats.push({ id: `v${formats.length}`, url, width: Number(video.width || item.original_width || 0), height: Number(video.height || item.original_height || 0), size: null });
    }
    if (!formats.length) throw new Error('This Threads post has no public MP4 video.');
    const caption = object(post.caption), user = object(post.user);
    return { title: String(caption.text || `Threads video ${code}`).slice(0, 180), uploader: typeof user.username === 'string' ? user.username.slice(0, 100) : null, duration: null, thumbnail: null, formats: formats.slice(0, 8) };
}

export async function inspectThreadsPost(input: string) {
    const code = new URL(input).pathname.match(/\/post\/([a-zA-Z0-9_-]+)/)?.[1];
    if (!code) throw new Error('Invalid Threads post.');
    const response = await fetch(input, { signal: AbortSignal.timeout(12000), redirect: 'error', cache: 'no-store', headers: { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', accept: 'text/html' } });
    if (!response.ok) throw new Error('Threads public page is unavailable.');
    if (Number(response.headers.get('content-length')) > 3_000_000) throw new Error('Threads response is too large.');
    const html = await response.text();
    if (html.length > 3_000_000) throw new Error('Threads response is too large.');
    return parseThreadsVideo(html, code);
}

export async function fetchThreadsMedia(url: string) {
    if (!safeThreadsMediaUrl(url)) throw new Error('Invalid Threads media address.');
    const response = await fetch(url, { signal: AbortSignal.timeout(120000), redirect: 'error', cache: 'no-store', headers: { referer: 'https://www.threads.com/' } });
    if (!response.ok || !response.body || !response.headers.get('content-type')?.toLowerCase().includes('video/')) throw new Error('Threads media is unavailable.');
    if (Number(response.headers.get('content-length')) > 250_000_000) { await response.body.cancel(); throw new Error('Video exceeds 250 MB.'); }
    let bytes = 0;
    return response.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({ transform(chunk, controller) { bytes += chunk.byteLength; if (bytes > 250_000_000) throw new Error('Video exceeds 250 MB.'); controller.enqueue(chunk); } }));
}
