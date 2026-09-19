import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { extractMediaMetadata } from '@/lib/media-metadata';

export const runtime = 'nodejs';

const MAX_METADATA_BYTES = 12 * 1024 * 1024;
const allowedRoles = new Set(['OWNER', 'ADMIN', 'EDITOR']);

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!allowedRoles.has(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const body = await request.json().catch(() => ({})) as { assetId?: string; url?: string };
        const asset = body.assetId
            ? await prisma.mediaAsset.findUnique({ where: { id: body.assetId } })
            : body.url
                ? await prisma.mediaAsset.findFirst({ where: { url: body.url } })
                : null;
        if (!asset) return NextResponse.json({ error: 'Choose an image from Media Library first.' }, { status: 404 });
        if (!asset.mimeType.startsWith('image/')) return NextResponse.json({ error: 'Metadata import is available for image files.' }, { status: 415 });
        if (asset.size > MAX_METADATA_BYTES) return NextResponse.json({ error: 'This image is too large for metadata import.' }, { status: 413 });

        const response = await fetch(asset.url, {
            cache: 'no-store',
            redirect: 'error',
            signal: AbortSignal.timeout(12_000),
            headers: { Accept: 'image/*' },
        });
        if (!response.ok) throw new Error('The image could not be read from media storage.');
        const announcedSize = Number(response.headers.get('content-length') || 0);
        if (announcedSize > MAX_METADATA_BYTES) return NextResponse.json({ error: 'This image is too large for metadata import.' }, { status: 413 });
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.byteLength > MAX_METADATA_BYTES) return NextResponse.json({ error: 'This image is too large for metadata import.' }, { status: 413 });

        const metadata = await extractMediaMetadata(buffer);
        return NextResponse.json({ metadata }, { headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Metadata could not be read.' }, { status: 500 });
    }
}
