import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { SITE_HEALTH_LOG_RETENTION_DAYS } from '@/lib/site-health';

export const dynamic = 'force-dynamic';

async function authorised() {
    const session = await auth();
    return Boolean(session?.user && ['OWNER', 'ADMIN'].includes(session.user.role));
}

export async function GET() {
    if (!await authorised()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const cutoff = new Date(Date.now() - SITE_HEALTH_LOG_RETENTION_DAYS * 86_400_000);
    await prisma.siteHealthLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
    const items = await prisma.siteHealthLog.findMany({ where: { createdAt: { gte: cutoff } }, orderBy: { lastSeenAt: 'desc' }, take: 500 });
    return NextResponse.json({ items, retentionDays: SITE_HEALTH_LOG_RETENTION_DAYS }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}

export async function DELETE() {
    if (!await authorised()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const result = await prisma.siteHealthLog.deleteMany();
    return NextResponse.json({ deleted: result.count }, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
}
