import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSocialVideoUrl, signDownloadToken, verifyDownloadToken, summarizeVideoInfo, safeFilename } from '../../src/modules/video-download/core.ts';

test('accepts only direct HTTPS links on supported social hosts', () => {
    assert.equal(parseSocialVideoUrl('https://www.instagram.com/reel/abc/?utm_source=x#top').platform, 'Instagram');
    assert.equal(parseSocialVideoUrl('https://x.com/person/status/123').platform, 'X');
    for (const url of ['http://x.com/person/status/1', 'https://evil.example/video', 'https://x.com.evil.example/status/1', 'https://127.0.0.1/video', 'https://user:pass@facebook.com/video']) assert.throws(() => parseSocialVideoUrl(url));
});

test('download tokens are signed, expire and cannot change format', () => {
    const token = signDownloadToken({ url: 'https://facebook.com/watch/?v=123', formatId: 'h264_720', title: 'Test', expires: Date.now() + 10000 }, 'test-secret');
    assert.equal(verifyDownloadToken(token, 'test-secret').formatId, 'h264_720');
    assert.throws(() => verifyDownloadToken(token, 'other-secret'));
    assert.throws(() => verifyDownloadToken(`${token[0] === 'a' ? 'b' : 'a'}${token.slice(1)}`, 'test-secret'));
    assert.throws(() => verifyDownloadToken(signDownloadToken({ url: 'https://x.com/u/status/1', formatId: 'best', title: 'Test', expires: Date.now() - 1 }, 'test-secret'), 'test-secret'));
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
