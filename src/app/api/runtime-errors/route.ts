import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { runtimeErrorKinds, type RuntimeErrorKind } from '@/lib/runtime-errors';
import { recordRuntimeError } from '@/lib/runtime-errors.server';

export const dynamic = 'force-dynamic';
const buckets = new Map<string, number>();
let windowStart = 0;
let total = 0;

export async function POST(request: NextRequest) {
    const origin = request.headers.get('origin');
    const allowed = [request.nextUrl.origin, process.env.SITE_URL, process.env.NEXT_PUBLIC_SITE_URL].filter(Boolean);
    if (!origin || !allowed.some((value) => { try { return new URL(value!).origin === origin; } catch { return false; } })) return new NextResponse(null, { status: 403 });
    if (Date.now() - windowStart > 60000) { buckets.clear(); total = 0; windowStart = Date.now(); }
    const key = createHash('sha256').update(request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown').digest('hex');
    const count = buckets.get(key) || 0;
    if (count >= 20 || total >= 200) return new NextResponse(null, { status: 429 });
    buckets.set(key, count + 1); total++;
    // Bound the body while reading, including requests without Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return new NextResponse(null, { status: 400 });
    const chunks: Uint8Array[] = []; let size = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 2048) { await reader.cancel(); return new NextResponse(null, { status: 413 }); }
            chunks.push(value);
        }
        const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!runtimeErrorKinds.includes(payload.kind as RuntimeErrorKind)) return new NextResponse(null, { status: 400 });
        await recordRuntimeError({ source: 'browser', kind: payload.kind, path: payload.path, resource: payload.resource, code: payload.code, status: Number.isInteger(payload.status) && payload.status >= 400 && payload.status <= 599 ? payload.status : undefined });
    } catch { return new NextResponse(null, { status: 400 }); }
    return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
