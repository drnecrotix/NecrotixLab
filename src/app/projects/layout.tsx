import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { requireManagedPageAccess } from '@/lib/page-access';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Projects',
    description: 'Explore my portfolio of projects and work.',
};

export default async function ProjectsLayout({ children }: { children: ReactNode }) {
    await requireManagedPageAccess('projects');
    return children;
}
