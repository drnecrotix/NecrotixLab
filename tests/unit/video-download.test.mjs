import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSocialVideoUrl, signDownloadToken, verifyDownloadToken, summarizeVideoInfo, safeFilename } from '../../src/modules/video-download/core.ts';
import { parseXVideo, safeXMediaUrl } from '../../src/modules/video-download/x-public.ts';
import { inspectThreadsPost, parseThreadsVideo, safeThreadsMediaUrl } from '../../src/modules/video-download/threads-public.ts';
import { parseYouTubeVideo, safeYouTubeMediaUrl, inspectYouTubeVideo } from '../../src/modules/video-download/youtube-public.ts';

test('accepts only direct HTTPS X post links', () => {
    assert.equal(parseSocialVideoUrl('https://x.com/person/status/123').platform, 'X');
    for (const url of ['http://x.com/person/status/1', 'https://evil.example/video', 'https://x.com.evil.example/status/1', 'https://127.0.0.1/video', 'https://facebook.com/watch?v=123', 'https://x.com/person/likes']) assert.throws(() => parseSocialVideoUrl(url));
});

test('accepts canonical public Threads and YouTube URLs and rejects lookalike hosts', () => {
    assert.equal(parseSocialVideoUrl('https://www.threads.com/@user/post/DaGcWDwj8tW').platform, 'Threads');
    assert.equal(parseSocialVideoUrl('https://www.threads.com/t/DaGcWDwj8tW').platform, 'Threads');
    assert.equal(parseSocialVideoUrl('https://youtu.be/abcdefghijk').platform, 'YouTube');
    assert.equal(parseSocialVideoUrl('https://youtube.com/shorts/abcdefghijk').platform, 'YouTube');
    for (const url of ['https://threads.com.evil.test/@u/post/DaGcWDwj8tW', 'https://youtube.com.evil.test/watch?v=abcdefghijk', 'https://threads.com/share/abcdef', 'https://youtube.com/playlist?list=abc']) assert.throws(() => parseSocialVideoUrl(url));
});

test('Threads selects only the requested post and approved CDN MP4', () => {
    const html = `<script type="application/json">${JSON.stringify({ items: [
        { code: 'other', video_versions: [{ url: 'https://scontent.cdninstagram.com/other.mp4' }] },
        { code: 'DaGcWDwj8tW', caption: { text: 'My video' }, user: { username: 'test' }, video_versions: [{ url: 'https://scontent.cdninstagram.com/a.mp4', width: 640, height: 360 }, { url: 'https://cdninstagram.com.evil.test/b.mp4' }] },
    ] })}</script>`;
    const parsed = parseThreadsVideo(html, 'DaGcWDwj8tW');
    assert.equal(parsed.formats.length, 1);
    assert.equal(parsed.title, 'My video');
    assert.equal(safeThreadsMediaUrl('https://cdninstagram.com.evil.test/b.mp4'), null);
    assert.throws(() => parseThreadsVideo(html, 'missing'));
});

test('Threads short links resolve only a matching canonical post and carousel clips retain their labels', async () => {
    const html = `<meta property="og:url" content="https://www.threads.com/@user/post/DaGcWDwj8tW"><script type="application/json">${JSON.stringify({ code: 'DaGcWDwj8tW', carousel_media: [
        { video_versions: [{ url: 'https://scontent.cdninstagram.com/a-low.mp4', height: 360 }, { url: 'https://scontent.cdninstagram.com/a-hd.mp4', height: 720 }] },
        { video_versions: [{ url: 'https://scontent.cdninstagram.com/b.mp4', height: 1080 }] },
    ] })}</script>`;
    const original = globalThis.fetch;
    globalThis.fetch = async () => new Response(html);
    try {
        const result = await inspectThreadsPost('https://www.threads.com/t/DaGcWDwj8tW');
        assert.deepEqual(result.formats.map((f) => [f.part, f.height]), [[1, 720], [1, 360], [2, 1080]]);
    } finally { globalThis.fetch = original; }
});

test('YouTube chooses only progressive MP4 on Googlevideo and parses player page', async () => {
    const player = { videoDetails: { title: 'Example', author: 'Creator' }, streamingData: { formats: [{ mimeType: 'video/mp4; codecs="avc1, mp4a"', url: 'https://r1---sn.googlevideo.com/videoplayback?x=1', height: 360 }, { mimeType: 'video/mp4', url: 'https://googlevideo.com.evil.test/videoplayback', height: 720 }], adaptiveFormats: [
        { mimeType: 'video/mp4', url: 'https://r1---sn.googlevideo.com/videoplayback?video=1', height: 1080, width: 1920 },
        { mimeType: 'audio/mp4', url: 'https://r1---sn.googlevideo.com/videoplayback?audio=1', bitrate: 128000 },
        { mimeType: 'video/mp4', url: 'https://evil.example/videoplayback', height: 2160 },
    ] } };
    assert.deepEqual(parseYouTubeVideo(player).formats.map((f) => [f.height, f.mediaKind]), [[1080, 'video-only'], [360, 'muxed'], [0, 'audio-only']]);
    assert.equal(safeYouTubeMediaUrl('https://googlevideo.com.evil.test/videoplayback'), null);
    const original = globalThis.fetch;
    globalThis.fetch = async () => new Response(`<script>var ytInitialPlayerResponse = ${JSON.stringify(player)};</script>`);
    try { assert.equal((await inspectYouTubeVideo('https://youtu.be/abcdefghijk')).title, 'Example'); }
    finally { globalThis.fetch = original; }
});

test('download tokens are signed, expire and cannot change format', () => {
    const token = signDownloadToken({ url: 'https://x.com/u/status/123', formatId: 'v0', title: 'Test', expires: Date.now() + 10000 }, 'test-secret');
    assert.equal(verifyDownloadToken(token, 'test-secret').formatId, 'v0');
    assert.throws(() => verifyDownloadToken(token, 'other-secret'));
    assert.throws(() => verifyDownloadToken(`${token[0] === 'a' ? 'b' : 'a'}${token.slice(1)}`, 'test-secret'));
    assert.throws(() => verifyDownloadToken(signDownloadToken({ url: 'https://x.com/u/status/1', formatId: 'best', title: 'Test', expires: Date.now() - 1 }, 'test-secret'), 'test-secret'));
});

test('X embed selects only direct MP4 from the expected media host', () => {
    const parsed = parseXVideo({ text: 'Video', video: { variants: [
        { url: 'https://video.twimg.com/ext_tw_video/123/vid/640x360/a.mp4', content_type: 'video/mp4' },
        { url: 'https://video.twimg.com/ext_tw_video/123/vid/1280x720/b.mp4' },
        { url: 'https://evil.example/a.mp4' },
        { url: 'https://video.twimg.com/ext_tw_video/123/pl/a.m3u8' },
    ] } });
    assert.deepEqual(parsed.formats.map((f) => f.height), [720, 360]);
    assert.equal(safeXMediaUrl('https://video.twimg.com.evil.example/a.mp4'), null);
    const quoted = parseXVideo({ text: 'Quoted video', quoted_tweet: { mediaDetails: [{ video_info: { variants: [{ url: 'https://video.twimg.com/ext_tw_video/123/vid/640x360/c.mp4' }] } }] } });
    assert.equal(quoted.formats[0].height, 360);
});

test('X syndication request includes a token and extracts returned media', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
        assert.match(String(url), /id=2102754001267958263&token=[a-z0-9]+$/);
        assert.equal(options.headers['user-agent'], 'Googlebot');
        return new Response(JSON.stringify({ mediaDetails: [{ video_info: { variants: [{ url: 'https://video.twimg.com/ext_tw_video/123/vid/640x360/a.mp4' }] } }] }), { headers: { 'content-type': 'application/json' } });
    };
    try {
        const { inspectXPost } = await import('../../src/modules/video-download/x-public.ts');
        assert.equal((await inspectXPost('https://x.com/bunnypjq/status/2102754001267958263?s=20')).formats[0].height, 360);
    } finally { globalThis.fetch = originalFetch; }
});

test('selects direct MP4 with audio and sanitizes filename', () => {
    const result = summarizeVideoInfo({ title: 'Sample', formats: [
        { format_id: '720', ext: 'mp4', height: 720, vcodec: 'h264', acodec: 'aac', protocol: 'https' },
        { format_id: 'video-only', ext: 'mp4', height: 1080, vcodec: 'h264', acodec: 'none', protocol: 'https' },
        { format_id: 'hls', ext: 'mp4', height: 1080, vcodec: 'h264', acodec: 'aac', protocol: 'm3u8_native' },
    ] });
    assert.deepEqual(result.formats.map((f) => f.id), ['720']);
    assert.equal(safeFilename('../Test <video>'), 'Test-video.mp4');
});
