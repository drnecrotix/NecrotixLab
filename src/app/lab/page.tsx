import { toolsPackageActive } from '@/lib/addons.server';
import { LabPageClient } from '@/components/lab/LabPageClient';

export default async function LabPage() {
    return <LabPageClient toolsAvailable={await toolsPackageActive()} />;
}
