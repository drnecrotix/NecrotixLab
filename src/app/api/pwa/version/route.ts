import { NextResponse } from 'next/server';
import { installedPortfolioVersion } from '@/lib/installed-version';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
    return NextResponse.json(
        { version: installedPortfolioVersion() },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
}
