import type { ReactNode } from 'react';
import { requireManagedPageAccess } from '@/lib/page-access';

export const dynamic = 'force-dynamic';

export default async function JourneyLayout({ children }: { children: ReactNode }) {
    await requireManagedPageAccess('journey');
    return children;
}
