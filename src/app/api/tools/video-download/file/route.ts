import { NextRequest, NextResponse } from 'next/server';
import { parseSocialVideoUrl, safeFilename, verifyDownloadToken } from '@/modules/video-download/core';
import { fetchXMedia, inspectXPost } from '@/modules/video-download/x-public';
import { fetchThreadsMedia, inspectThreadsPost } from '@/modules/video-download/threads-public';
import { fetchYouTubeMedia, inspectYouTubeVideo } from '@/modules/video-download/youtube-public';
import { addonEnabled } from '@/lib/addons.server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const downloads = new Map<string, { count: number; expires: number }>();
export async function GET(request: NextRequest) {
    if (!(await addonEnabled('social-video'))) return NextResponse.json({ error: 'Video Download is disabled.' }, { status: 404 });
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
        const { platform } = parseSocialVideoUrl(data.url);
        const video = platform === 'X' ? await inspectXPost(data.url) : platform === 'Threads' ? await inspectThreadsPost(data.url) : await inspectYouTubeVideo(data.url);
        const selected = video.formats.find((format) => format.id === data.formatId);
        if (!selected) throw new Error('Video quality is no longer available. Inspect the post again.');
        const stream = platform === 'X' ? await fetchXMedia(selected.url) : platform === 'Threads' ? await fetchThreadsMedia(selected.url) : await fetchYouTubeMedia(selected.url);
        const audioOnly = 'mediaKind' in selected && selected.mediaKind === 'audio-only';
        const videoOnly = 'mediaKind' in selected && selected.mediaKind === 'video-only';
        const filename = safeFilename(data.title).replace(/\.mp4$/, `${videoOnly ? '-video-only' : ''}.${audioOnly ? 'm4a' : 'mp4'}`);
        return new Response(stream, { headers: { 'Content-Type': audioOnly ? 'audio/mp4' : 'video/mp4', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
    } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Download unavailable.' }, { status: 400 }); }
}
