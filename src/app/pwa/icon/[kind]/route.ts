import { NextResponse } from 'next/server';
import { isPwaIconKind } from '@/lib/pwa-icons';
import { renderPwaIcon } from '@/lib/pwa-icon-render.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string }> }) {
    const { kind } = await params;
    if (!isPwaIconKind(kind)) {
        return new NextResponse('Not found', { status: 404 });
    }
    const body = await renderPwaIcon(kind);
    if (!body) return new NextResponse('Not found', { status: 404 });
    return new NextResponse(new Uint8Array(body), {
        headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
    });
}
