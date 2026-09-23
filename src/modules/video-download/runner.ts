import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const binary = () => process.env.YTDLP_BIN?.trim() || (existsSync(path.join(process.cwd(), 'node_modules/youtube-dl-exec/bin/yt-dlp')) ? path.join(process.cwd(), 'node_modules/youtube-dl-exec/bin/yt-dlp') : 'yt-dlp');
let active = 0;
export async function videoBackendAvailable() {
    return await new Promise<boolean>((resolve) => { const process = spawn(binary(), ['--version'], { stdio: ['ignore', 'pipe', 'pipe'] }); const timeout = setTimeout(() => { process.kill(); resolve(false); }, 3000); process.once('error', () => { clearTimeout(timeout); resolve(false); }); process.once('close', (code) => { clearTimeout(timeout); resolve(code === 0); }); });
}
const common = ['--ignore-config', '--no-playlist', '--no-warnings', '--ies', 'facebook,facebook:reel,FacebookPluginsVideo,FacebookRedirectURL,Instagram,twitter,twitter:card,twitter:amplify'];
export async function inspectVideo(url: string) {
    if (active >= 2) throw new Error('Video service is busy. Try again shortly.');
    active++;
    try {
        return await new Promise<unknown>((resolve, reject) => {
            const child = spawn(binary(), [...common, '--skip-download', '--dump-single-json', url], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NO_COLOR: '1' } });
            let output = '', errors = '', settled = false;
            const finish = (error?: Error) => { if (settled) return; settled = true; clearTimeout(timeout); if (error) reject(error); else { try { resolve(JSON.parse(output)); } catch { reject(new Error('Could not read video metadata.')); } } };
            const timeout = setTimeout(() => { child.kill('SIGKILL'); finish(new Error('The source took too long to respond.')); }, 25_000);
            child.stdout.on('data', (chunk: Buffer) => { output += chunk.toString(); if (output.length > 2_000_000) { child.kill('SIGKILL'); finish(new Error('Video metadata is too large.')); } });
            child.stderr.on('data', (chunk: Buffer) => { errors = (errors + chunk.toString()).slice(-2000); });
            child.once('error', () => finish(new Error('yt-dlp is unavailable on this server.')));
            child.once('close', (code) => finish(code === 0 ? undefined : new Error(/login|private|sign in/i.test(errors) ? 'This post requires login or is private.' : 'Could not inspect this public video. The source may have changed or blocked access.')));
        });
    } finally { active--; }
}
export function streamVideo(url: string, formatId: string) {
    if (active >= 2) throw new Error('Video service is busy. Try again shortly.');
    active++;
    const child = spawn(binary(), [...common, '--format', formatId, '--max-filesize', '250M', '--no-progress', '--output', '-', url], { stdio: ['ignore', 'pipe', 'pipe'] });
    let completed = false, bytes = 0;
    const release = () => { if (!completed) { completed = true; active--; } };
    const timeout = setTimeout(() => child.kill('SIGKILL'), 120_000);
    child.stderr.resume();
    child.once('error', () => { clearTimeout(timeout); release(); });
    child.once('close', () => { clearTimeout(timeout); release(); });
    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            child.stdout.on('data', (chunk: Buffer) => {
                bytes += chunk.length;
                if (bytes > 250_000_000) { child.kill('SIGKILL'); controller.error(new Error('Download exceeded 250 MB.')); return; }
                try { controller.enqueue(new Uint8Array(chunk)); if (controller.desiredSize !== null && controller.desiredSize <= 0) child.stdout.pause(); } catch { child.kill('SIGKILL'); }
            });
            child.once('close', (code) => { try { if (code === 0) controller.close(); else controller.error(new Error('The video source stopped the download.')); } catch { /* stream already cancelled */ } });
            child.once('error', () => { try { controller.error(new Error('Download process failed.')); } catch { /* stream already cancelled */ } });
        },
        pull() { child.stdout.resume(); },
        cancel() { child.kill('SIGKILL'); release(); },
    });
    return stream;
}
