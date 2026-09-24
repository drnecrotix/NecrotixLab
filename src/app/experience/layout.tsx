import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { requireManagedPageAccess } from '@/lib/page-access';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Experience',
    description: 'My professional journey and educational background.',
};

export default async function ExperienceLayout({ children }: { children: ReactNode }) {
    await requireManagedPageAccess('journey');
    return children;
}
