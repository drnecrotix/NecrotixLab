import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const packageDir = join(root, 'node_modules', 'youtube-dl-exec');
const binDir = join(packageDir, 'bin');
const statusFile = join(root, 'tmp', 'video-backend-status.json');
const release = '2026.08.19';
const assets = [
  { name: 'yt-dlp', sha256: '1fa6733c37ea6fb51c99ad8fe785e7b7e5f3246c9b980230329d4fb72ed8d4d6', size: 3072469 },
  { name: 'yt-dlp_linux', sha256: '58162f9bfdc27458ea47bfcb311cf47028f17d8154a8bf7d689861d46399230a', size: 40446224 },
];
function report(state, reason) {
  mkdirSync(join(root, 'tmp'), { recursive: true });
  writeFileSync(statusFile, JSON.stringify({ state, reason, updatedAt: new Date().toISOString() }));
  console.log(`[video] ${state}: ${reason}`);
}
function works(file) {
  if (!existsSync(file)) return false;
  const result = spawnSync(file, ['--version'], { encoding: 'utf8', timeout: 7000 });
  return !result.error && result.status === 0;
}
function verify(file, asset) {
  if (!existsSync(file)) return false;
  const bytes = readFileSync(file);
  return bytes.length === asset.size && createHash('sha256').update(bytes).digest('hex') === asset.sha256;
}
async function download(asset) {
  const url = `https://github.com/yt-dlp/yt-dlp/releases/download/${release}/${asset.name}`;
  const target = join(binDir, asset.name), temp = `${target}.${process.pid}.tmp`;
  mkdirSync(binDir, { recursive: true });
  try {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = Buffer.from(await response.arrayBuffer());
      if (data.length > asset.size + 1024) throw new Error('Unexpected file size');
      writeFileSync(temp, data);
      if (!verify(temp, asset)) throw new Error('Node download checksum or size mismatch');
    } catch (fetchError) {
      // curl handles HTTP proxy configuration on hosts where Node's fetch does not.
      const result = spawnSync('curl', ['--fail', '--location', '--silent', '--show-error', '--max-time', '60', '--output', temp, url], { encoding: 'utf8', timeout: 65000 });
      if (result.error || result.status !== 0) throw new Error(`Node download failed; curl failed (${result.status ?? result.error?.code ?? 'unknown'}). ${fetchError instanceof Error ? fetchError.message : ''}`);
    }
    if (!verify(temp, asset)) throw new Error('Official release checksum or size mismatch');
    chmodSync(temp, 0o755);
    renameSync(temp, target);
    return true;
  } finally { rmSync(temp, { force: true }); }
}

// An unusable standalone binary must not shadow a working Python zipapp.
if (existsSync(join(binDir, 'yt-dlp_linux')) && !works(join(binDir, 'yt-dlp_linux'))) rmSync(join(binDir, 'yt-dlp_linux'), { force: true });
if (process.env.YTDLP_BIN && works(process.env.YTDLP_BIN)) report('ready', 'Configured extractor works.');
else if (!existsSync(packageDir)) report('unavailable', 'youtube-dl-exec package is missing. Reinstall application dependencies.');
else if (works(join(binDir, 'yt-dlp_linux')) || works(join(binDir, 'yt-dlp'))) report('ready', 'Bundled extractor works.');
else {
  const attempts = [];
  for (const asset of assets) {
    if (asset.name === 'yt-dlp_linux' && (process.platform !== 'linux' || process.arch !== 'x64')) continue;
    try {
      await download(asset);
      if (works(join(binDir, asset.name))) { report('ready', `${asset.name} installed and verified.`); break; }
      attempts.push(`${asset.name}: host cannot execute it`);
      rmSync(join(binDir, asset.name), { force: true });
    } catch (error) { attempts.push(`${asset.name}: ${error instanceof Error ? error.message.slice(0, 160) : 'download failed'}`); }
  }
  if (!works(join(binDir, 'yt-dlp_linux')) && !works(join(binDir, 'yt-dlp'))) report('unavailable', attempts.join('; ') || 'No compatible extractor found.');
}
