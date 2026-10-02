import { auth } from '@/auth';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { zipSync } from 'fflate';
import manifest from '@addons/Booking/manifest.json';
export const runtime = 'nodejs';
export async function GET() {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) return new Response('Forbidden', { status: 403 });
    const root = path.join(process.cwd(), 'Addons', 'Booking');
    const entries: Record<string, Uint8Array> = {};
    for (const name of await readdir(root)) {
        if (!/\.(tsx?|json|md)$/.test(name)) continue;
        entries[`Addons/Booking/${name}`] = new Uint8Array(await readFile(path.join(root, name)));
    }
    const zip = zipSync(entries);
    return new Response(new Uint8Array(zip), { headers: { 'content-type': 'application/zip', 'content-disposition': `attachment; filename="necrotixlab-booking-${manifest.version}.zip"`, 'cache-control': 'private, no-store' } });
}
