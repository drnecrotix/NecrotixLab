import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const packageDir = join(root, 'node_modules', 'youtube-dl-exec');
const installScript = join(packageDir, 'scripts', 'postinstall.js');
const binDir = join(packageDir, 'bin');

function works(file) {
  if (!existsSync(file)) return false;
  const result = spawnSync(file, ['--version'], { encoding: 'utf8', timeout: 5000 });
  return !result.error && result.status === 0;
}

function download(filename) {
  const environment = { ...process.env, YOUTUBE_DL_FILENAME: filename };
  delete environment.YOUTUBE_DL_SKIP_DOWNLOAD;
  const result = spawnSync(process.execPath, [installScript], { env: environment, encoding: 'utf8', timeout: 120000 });
  if (result.error || result.status !== 0) {
    console.warn(`Video backend ${filename} download failed: ${(result.stderr || result.error?.message || '').slice(-500)}`);
    return false;
  }
  return true;
}

if (!existsSync(installScript)) {
  console.warn('Video backend package is missing. Install application dependencies first.');
} else {
  const pythonBinary = join(binDir, 'yt-dlp');
  const standaloneBinary = join(binDir, 'yt-dlp_linux');
  if (!works(pythonBinary) && !works(standaloneBinary)) {
    if (!download('yt-dlp') || !works(pythonBinary)) {
      if (process.platform === 'linux' && process.arch === 'x64') {
        if (download('yt-dlp_linux') && !works(standaloneBinary)) rmSync(standaloneBinary, { force: true });
      }
    }
  }
  if (works(standaloneBinary) || works(pythonBinary)) console.log('Video backend executable is ready.');
  else console.warn('Video backend unavailable. This host may block executable downloads or child processes.');
}
