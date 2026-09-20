import { NextResponse } from 'next/server';

// Old cached clients may still send events. Acknowledge without recording data.
export async function POST() {
    return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
