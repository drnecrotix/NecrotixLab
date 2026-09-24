import { auth } from '@/auth';
import { readStagedAddon } from '@/lib/addon-staging.server';

export const runtime = 'nodejs';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) return new Response('Forbidden', { status: 403 });
    const { id } = await params;
    const archive = await readStagedAddon(id).catch(() => null);
    if (!archive) return new Response('Plugin not found', { status: 404 });
    return new Response(new Uint8Array(archive.bytes), { headers: { 'content-type': 'application/zip', 'content-disposition': `attachment; filename="necrotixlab-${archive.entry.id}-${archive.entry.version}.zip"`, 'cache-control': 'private, no-store' } });
}
