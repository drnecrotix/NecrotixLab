import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectVideo, streamVideo, videoBackendAvailable } from '../../src/modules/video-download/runner.ts';

test('video runner invokes the configured extractor and streams its output', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'necrotix-video-'));
    const bin = join(dir, 'fake-yt-dlp');
    const previous = process.env.YTDLP_BIN;
    try {
        await writeFile(bin, `#!/bin/sh\ncase " $* " in\n  *" --version "*) echo 2026.test;;\n  *" --dump-single-json "*) echo '{"title":"Fixture","formats":[]}' ;;\n  *" --output - "*) printf 'fixture-mp4' ;;\n  *) exit 1;;\nesac\n`, { mode: 0o755 });
        process.env.YTDLP_BIN = bin;
        assert.equal(await videoBackendAvailable(), true);
        assert.equal((await inspectVideo('https://x.com/u/status/1')).title, 'Fixture');
        const response = new Response(streamVideo('https://x.com/u/status/1', 'mp4_720'));
        assert.equal(await response.text(), 'fixture-mp4');
    } finally {
        if (previous === undefined) delete process.env.YTDLP_BIN; else process.env.YTDLP_BIN = previous;
        await rm(dir, { recursive: true, force: true });
    }
});
