import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ count: 0 }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }

    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
    const [requests, comments] = await Promise.all([
        prisma.serviceRequest.count({
            where: { status: { in: ['NEW', 'REVIEWING'] } },
        }),
        prisma.blogComment.count({
            where: { status: { not: 'SPAM' }, createdAt: { gte: since } },
        }),
    ]);

    return NextResponse.json({
        count: requests + comments,
        requests,
        comments,
    }, { headers: { 'Cache-Control': 'no-store' } });
}
