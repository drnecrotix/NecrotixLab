import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isManagedMediaKey, readMediaFile } from '@/lib/media-storage';
import { prisma } from '@/lib/prisma';
import { normalizeResumeSettings, RESUME_CONFIG_SLUG } from '@/lib/resume-settings';

export const dynamic = 'force-dynamic';

function downloadHeaders(fileName: string) {
    return {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName.replace(/[^a-zA-Z0-9._-]+/g, '-') || 'cv.pdf'}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
    };
}

export async function GET(request: Request) {
    const page = await prisma.page.findUnique({
        where: { slug: RESUME_CONFIG_SLUG },
        select: { content: true },
    }).catch(() => null);
    const settings = normalizeResumeSettings(page?.content);
    if (!settings.enabled) return NextResponse.json({ error: 'CV downloads are disabled.' }, { status: 404 });
    const url = settings.downloadPdfUrl;

    if (url === '/resume.pdf') {
        try {
            const bytes = await readFile(path.join(process.cwd(), 'public', 'resume.pdf'));
            return new NextResponse(new Uint8Array(bytes), { headers: downloadHeaders('Nikola-Stoyanov-CV.pdf') });
        } catch {
            return NextResponse.json({ error: 'Default CV PDF is unavailable.' }, { status: 404 });
        }
    }

    const asset = await prisma.mediaAsset.findFirst({
        where: { url },
        select: { fileName: true, mimeType: true, url: true, key: true },
    }).catch(() => null);
    if (!asset || (asset.mimeType !== 'application/pdf' && !asset.fileName.toLowerCase().endsWith('.pdf'))) {
        return NextResponse.json({ error: 'Configured CV PDF is not available in Media Library.' }, { status: 404 });
    }

    try {
        // Managed uploads must not depend on a loopback request through the public host.
        if (isManagedMediaKey(asset.key)) {
            const bytes = await readMediaFile(asset.key);
            return new NextResponse(new Uint8Array(bytes), { headers: downloadHeaders(asset.fileName) });
        }

        const sourceUrl = new URL(asset.url, request.url);
        const upstream = await fetch(sourceUrl, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
        if (!upstream.ok) throw new Error(`PDF source returned ${upstream.status}`);
        const bytes = await upstream.arrayBuffer();
        return new NextResponse(bytes, { headers: downloadHeaders(asset.fileName) });
    } catch (error) {
        console.error('Failed to read configured CV PDF', error);
        return NextResponse.json({ error: 'The CV PDF could not be read. Check that the selected file is still available in Media Library.' }, { status: 502 });
    }
}
