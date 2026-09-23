import { NextRequest, NextResponse } from 'next/server';
import { parseSocialVideoUrl, signDownloadToken } from '@/modules/video-download/core';
import { inspectXPost } from '@/modules/video-download/x-public';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const attempts = new Map<string, { count: number; expires: number }>();
function limited(request: NextRequest) {
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now(), record = attempts.get(ip);
    if (attempts.size > 1000) for (const [key, value] of attempts) if (value.expires < now) attempts.delete(key);
    if (record && record.expires > now) { record.count++; return record.count > 8; }
    attempts.set(ip, { count: 1, expires: now + 60_000 }); return false;
}
export async function GET() {
    return NextResponse.json({ available: Boolean(process.env.AUTH_SECRET), reason: !process.env.AUTH_SECRET ? 'Server signing secret is missing.' : null, engine: 'X public embed', maxMb: 250 }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: NextRequest) {
    if (!process.env.AUTH_SECRET) return NextResponse.json({ error: 'Server signing secret is missing.' }, { status: 503 });
    if (limited(request)) return NextResponse.json({ error: 'Too many requests. Try again in one minute.' }, { status: 429 });
    try {
        if (Number(request.headers.get('content-length') || 0) > 4096) return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
        const body = await request.text();
        if (body.length > 4096) return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
        const payload = JSON.parse(body) as { url?: unknown };
        if (typeof payload.url !== 'string') throw new Error('Enter a public video URL.');
        const { url, platform } = parseSocialVideoUrl(payload.url);
        const result = await inspectXPost(url);
        return NextResponse.json({ ...result, platform, formats: result.formats.map(({ url: _mediaUrl, ...format }) => ({ ...format, downloadUrl: `/api/tools/video-download/file?token=${encodeURIComponent(signDownloadToken({ url, formatId: format.id, title: result.title, expires: Date.now() + 5 * 60_000 }, process.env.AUTH_SECRET!))}` })) }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Cannot inspect video.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } }); }
}
