import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
    const session = await auth();
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) return new NextResponse(null, { status: 403 });
    return NextResponse.json({ error: 'A/B testing has been retired. Use Audience & traffic.' }, { status: 410 });
}
