import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';
import { normalizeGallerySettings } from '@/lib/gallery-settings';
import { readMediaFile } from '@/lib/media-storage';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' }, select: { galleryContent: true } });
    const item = normalizeGallerySettings(settings?.galleryContent).items.find((entry) => entry.slug === slug && entry.isVisible && !entry.isNsfw);
    if (!item) return new NextResponse('Not found', { status: 404 });

    const image = item.socialImageUrl || (item.type === 'image' ? item.mediaUrl : item.thumbnailUrl);
    if (!image) return new NextResponse('Not found', { status: 404 });
    const asset = await prisma.mediaAsset.findFirst({ where: { url: image, mimeType: { startsWith: 'image/' } }, select: { key: true } });
    if (!asset) return new NextResponse('Not found', { status: 404 });

    try {
        const bytes = await readMediaFile(asset.key);
        const output = await sharp(bytes).rotate().resize(1200, 630, { fit: 'contain', background: '#101615' })
            .flatten({ background: '#101615' }).jpeg({ quality: 84 }).toBuffer();
        return new NextResponse(new Uint8Array(output), {
            headers: { 'Content-Type': 'image/jpeg', 'Content-Disposition': 'inline', 'Cache-Control': 'public, max-age=3600, s-maxage=3600', 'X-Content-Type-Options': 'nosniff' },
        });
    } catch {
        return new NextResponse('Image unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
}
