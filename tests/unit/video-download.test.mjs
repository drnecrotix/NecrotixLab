import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSocialVideoUrl, signDownloadToken, verifyDownloadToken, summarizeVideoInfo, safeFilename } from '../../src/modules/video-download/core.ts';
import { parseXVideo, safeXMediaUrl } from '../../src/modules/video-download/x-public.ts';

test('accepts only direct HTTPS X post links', () => {
    assert.equal(parseSocialVideoUrl('https://x.com/person/status/123').platform, 'X');
    for (const url of ['http://x.com/person/status/1', 'https://evil.example/video', 'https://x.com.evil.example/status/1', 'https://127.0.0.1/video', 'https://facebook.com/watch?v=123', 'https://x.com/person/likes']) assert.throws(() => parseSocialVideoUrl(url));
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
