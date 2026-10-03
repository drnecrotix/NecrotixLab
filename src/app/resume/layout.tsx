import { FeatureInDevelopment } from '@/components/layout/FeatureInDevelopment';
import type { ReactNode } from 'react';
import { requireManagedPageAccess } from '@/lib/page-access';

export const dynamic = 'force-dynamic';

export default async function ResumeLayout({ children }: { children: ReactNode }) {
    if (!await requireManagedPageAccess('resume')) return <FeatureInDevelopment />;
    return children;
}
