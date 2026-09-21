import { NextResponse } from 'next/server';
import { parseSplashSize } from '@/lib/pwa-icons';
import { renderAppleSplash } from '@/lib/pwa-icon-render.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
    const { size } = await params;
    const parsed = parseSplashSize(size);
    if (!parsed) return new NextResponse('Not found', { status: 404 });
    const body = await renderAppleSplash(parsed.width, parsed.height);
    return new NextResponse(new Uint8Array(body), {
        headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=0, must-revalidate',
        },
    });
}
