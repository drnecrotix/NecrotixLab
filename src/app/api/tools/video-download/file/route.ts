import { NextRequest, NextResponse } from 'next/server';
import { safeFilename, verifyDownloadToken } from '@/modules/video-download/core';
import { fetchXMedia, inspectXPost } from '@/modules/video-download/x-public';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const downloads = new Map<string, { count: number; expires: number }>();
export async function GET(request: NextRequest) {
    try {
        if (!process.env.AUTH_SECRET) return NextResponse.json({ error: 'Server signing secret is missing.' }, { status: 503 });
        const token = request.nextUrl.searchParams.get('token') || '';
        const data = verifyDownloadToken(token, process.env.AUTH_SECRET);
        const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || 'unknown';
        const now = Date.now();
        if (downloads.size > 1000) for (const [key, value] of downloads) if (value.expires < now) downloads.delete(key);
        const record = downloads.get(ip);
        if (record && record.expires > now) { if (++record.count > 4) return NextResponse.json({ error: 'Download limit reached. Try again shortly.' }, { status: 429 }); }
        else downloads.set(ip, { count: 1, expires: now + 60_000 });
        const video = await inspectXPost(data.url);
        const selected = video.formats.find((format) => format.id === data.formatId);
        if (!selected) throw new Error('Video quality is no longer available. Inspect the post again.');
        const stream = await fetchXMedia(selected.url);
        return new Response(stream, { headers: { 'Content-Type': 'video/mp4', 'Content-Disposition': `attachment; filename="${safeFilename(data.title)}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
    } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Download unavailable.' }, { status: 400 }); }
}
