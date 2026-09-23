type VideoVariant = { id: string; url: string; height: number; width: number; size: null };
type Data = Record<string, unknown>;
function object(value: unknown): Data { return value && typeof value === 'object' && !Array.isArray(value) ? value as Data : {}; }
export function safeXMediaUrl(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && url.hostname === 'video.twimg.com' && !url.port && !url.username && !url.password && url.pathname.endsWith('.mp4') ? url.toString() : null;
    } catch { return null; }
}
export function parseXVideo(data: unknown) {
    const tweet = object(data);
    const quoted = object(tweet.quoted_tweet);
    const media = [tweet, quoted].flatMap((post) => Array.isArray(post.mediaDetails) ? post.mediaDetails : []);
    const sources = [tweet.video, quoted.video, ...media.map((entry) => object(entry).video_info), ...media.map((entry) => object(entry).video)];
    const variants: VideoVariant[] = [];
    for (const source of sources) {
        const info = object(source);
        for (const item of Array.isArray(info.variants) ? info.variants : []) {
            const variant = object(item), mediaUrl = safeXMediaUrl(variant.url);
            if (!mediaUrl || variants.some((entry) => entry.url === mediaUrl)) continue;
            const match = new URL(mediaUrl).pathname.match(/\/(\d+)x(\d+)\//);
            variants.push({ id: `v${variants.length}`, url: mediaUrl, width: match ? Number(match[1]) : 0, height: match ? Number(match[2]) : 0, size: null });
        }
    }
    variants.sort((a, b) => b.height - a.height);
    // IDs are assigned after sorting so signed links select a stable quality on a fresh lookup.
    const formats = variants.slice(0, 8).map((item, index) => ({ ...item, id: `v${index}` }));
    if (!formats.length) throw new Error('The public X response contains no MP4. The post may be private, removed, or its video may not be exposed by the embed feed.');
    const user = object(tweet.user);
    return { title: String(tweet.text || 'X video').slice(0, 180), uploader: typeof user.screen_name === 'string' ? user.screen_name.slice(0, 100) : null, duration: null, thumbnail: null, formats };
}
export async function inspectXPost(input: string) {
    const id = new URL(input).pathname.match(/\/status\/(\d+)/)?.[1];
    if (!id) throw new Error('Invalid X post ID.');
    const token = ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');
    const endpoint = `https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=${token}`;
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(12000), redirect: 'error', headers: { accept: 'application/json', 'user-agent': 'Googlebot' }, cache: 'no-store' });
    if (!response.ok) throw new Error('X public embed is unavailable for this post.');
    if (Number(response.headers.get('content-length')) > 2_000_000) throw new Error('X response is too large.');
    const body = await response.text();
    if (body.length > 2_000_000) throw new Error('X response is too large.');
    return parseXVideo(JSON.parse(body));
}

export async function fetchXMedia(url: string) {
    if (!safeXMediaUrl(url)) throw new Error('Invalid media address.');
    const response = await fetch(url, { signal: AbortSignal.timeout(120000), redirect: 'error', cache: 'no-store' });
    if (!response.ok || !response.body || !response.headers.get('content-type')?.toLowerCase().includes('video/')) throw new Error('X media is unavailable.');
    if (Number(response.headers.get('content-length')) > 250_000_000) { await response.body.cancel(); throw new Error('Video exceeds 250 MB.'); }
    let bytes = 0;
    return response.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({ transform(chunk, controller) { bytes += chunk.byteLength; if (bytes > 250_000_000) throw new Error('Video exceeds 250 MB.'); controller.enqueue(chunk); } }));
}
