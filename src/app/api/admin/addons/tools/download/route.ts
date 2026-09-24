import { auth } from '@/auth';
import manifest from '@addons/Tools/manifest.json';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

export async function GET() {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) return new Response('Forbidden', { status: 403 });
    const archive = await readFile(path.join(process.cwd(), 'Addons', 'Tools', `necrotixlab-tools-${manifest.version}.zip`));
    return new Response(new Uint8Array(archive), { headers: { 'content-type': 'application/zip', 'content-disposition': `attachment; filename="necrotixlab-tools-${manifest.version}.zip"`, 'cache-control': 'private, no-store' } });
}
