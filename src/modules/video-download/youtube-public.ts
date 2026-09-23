type Data = Record<string, unknown>;
const object = (value: unknown): Data => value && typeof value === 'object' && !Array.isArray(value) ? value as Data : {};

export function safeYouTubeMediaUrl(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && !url.port && !url.username && !url.password && /(^|\.)googlevideo\.com$/.test(url.hostname) && url.pathname === '/videoplayback' ? url.toString() : null;
    } catch { return null; }
}

export function parseYouTubeVideo(input: unknown) {
    const player = object(input), details = object(player.videoDetails), streaming = object(player.streamingData);
    const muxed = (Array.isArray(streaming.formats) ? streaming.formats : []).map(object)
        .filter((format) => typeof format.mimeType === 'string' && format.mimeType.startsWith('video/mp4') && safeYouTubeMediaUrl(format.url))
        .sort((a, b) => Number(b.height || 0) - Number(a.height || 0))
        .map((format) => ({ url: String(format.url), width: Number(format.width || 0), height: Number(format.height || 0), size: Number(format.contentLength || 0) || null, mediaKind: 'muxed' as const }));
    const adaptive = (Array.isArray(streaming.adaptiveFormats) ? streaming.adaptiveFormats : []).map(object)
        .filter((format) => typeof format.mimeType === 'string' && /^(video|audio)\/mp4/.test(format.mimeType) && safeYouTubeMediaUrl(format.url));
    const video = adaptive.filter((format) => String(format.mimeType).startsWith('video/'))
        .sort((a, b) => Number(b.height || 0) - Number(a.height || 0) || Number(b.bitrate || 0) - Number(a.bitrate || 0))
        .filter((format, index, all) => all.findIndex((entry) => Number(entry.height) === Number(format.height)) === index)
        .slice(0, 8).map((format) => ({ url: String(format.url), width: Number(format.width || 0), height: Number(format.height || 0), size: Number(format.contentLength || 0) || null, mediaKind: 'video-only' as const }));
    const audio = adaptive.filter((format) => String(format.mimeType).startsWith('audio/'))
        .sort((a, b) => Number(b.bitrate || 0) - Number(a.bitrate || 0)).slice(0, 1)
        .map((format) => ({ url: String(format.url), width: 0, height: 0, size: Number(format.contentLength || 0) || null, mediaKind: 'audio-only' as const }));
    const formats = [...muxed, ...video, ...audio].sort((a, b) => b.height - a.height || (a.mediaKind === 'muxed' ? -1 : 1)).map((format, index) => ({ ...format, id: `v${index}` }));
    if (!formats.some((format) => format.mediaKind !== 'audio-only')) throw new Error('No public MP4 video stream is available. It may require sign-in or a player signature.');
    return { title: String(details.title || 'YouTube video').slice(0, 180), uploader: typeof details.author === 'string' ? details.author.slice(0, 100) : null, duration: Number(details.lengthSeconds || 0) || null, thumbnail: null, formats };
}

function playerJson(html: string): unknown {
    const start = html.search(/(?:var\s+ytInitialPlayerResponse\s*=|ytInitialPlayerResponse\s*=)\s*\{/);
    if (start < 0) return null;
    const offset = html.indexOf('{', start);
    let depth = 0, string = false, escape = false;
    for (let i = offset; i < html.length; i++) {
        const char = html[i];
        if (string) { if (escape) escape = false; else if (char === '\\') escape = true; else if (char === '"') string = false; }
        else if (char === '"') string = true;
        else if (char === '{') depth++;
        else if (char === '}' && --depth === 0) return JSON.parse(html.slice(offset, i + 1));
    }
    return null;
}

export async function inspectYouTubeVideo(input: string) {
    const parsed = new URL(input);
    const id = parsed.hostname === 'youtu.be' ? parsed.pathname.slice(1) : parsed.pathname.startsWith('/shorts/') ? parsed.pathname.split('/')[2] : parsed.searchParams.get('v');
    if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) throw new Error('Invalid YouTube video ID.');
    const response = await fetch(`https://www.youtube.com/watch?v=${id}`, { signal: AbortSignal.timeout(12000), redirect: 'error', cache: 'no-store', headers: { 'user-agent': 'Mozilla/5.0', accept: 'text/html' } });
    if (!response.ok) throw new Error('YouTube public page is unavailable.');
    if (Number(response.headers.get('content-length')) > 5_000_000) throw new Error('YouTube response is too large.');
    const html = await response.text();
    if (html.length > 5_000_000) throw new Error('YouTube response is too large.');
    const player = playerJson(html);
    try {
        const result = parseYouTubeVideo(player);
        if (result.formats.some((format) => format.mediaKind === 'video-only')) return result;
    } catch { /* Try the public Android player when the page has no direct streams. */ }
    {
        // The public Android player may expose a progressive stream when the web
        // player requires a JavaScript signature. Never accept a media URL outside Googlevideo.
        const key = html.match(/"INNERTUBE_API_KEY":"([a-zA-Z0-9_-]+)"/)?.[1];
        if (!key) return parseYouTubeVideo(player);
        const fallback = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${key}`, { method: 'POST', signal: AbortSignal.timeout(12000), redirect: 'error', cache: 'no-store', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ videoId: id, context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38', hl: 'en' } } }) });
        if (!fallback.ok) return parseYouTubeVideo(player);
        if (Number(fallback.headers.get('content-length')) > 3_000_000) throw new Error('YouTube response is too large.');
        const body = await fallback.text();
        if (body.length > 3_000_000) throw new Error('YouTube response is too large.');
        const android = parseYouTubeVideo(JSON.parse(body));
        try {
            const web = parseYouTubeVideo(player);
            return { ...android, formats: [...web.formats, ...android.formats.filter((format) => !web.formats.some((item) => item.url === format.url))].sort((a, b) => b.height - a.height || (a.mediaKind === 'muxed' ? -1 : 1)).map((format, index) => ({ ...format, id: `v${index}` })) };
        } catch { return android; }
    }
}

export async function fetchYouTubeMedia(url: string) {
    if (!safeYouTubeMediaUrl(url)) throw new Error('Invalid YouTube media address.');
    const response = await fetch(url, { signal: AbortSignal.timeout(120000), redirect: 'error', cache: 'no-store' });
    if (!response.ok || !response.body || !/^(video|audio)\//.test(response.headers.get('content-type')?.toLowerCase() || '')) throw new Error('YouTube media is unavailable.');
    if (Number(response.headers.get('content-length')) > 250_000_000) { await response.body.cancel(); throw new Error('Video exceeds 250 MB.'); }
    let bytes = 0;
    return response.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({ transform(chunk, controller) { bytes += chunk.byteLength; if (bytes > 250_000_000) throw new Error('Video exceeds 250 MB.'); controller.enqueue(chunk); } }));
}
