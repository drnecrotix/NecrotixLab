import { AdminOperationsWorkbench } from '@/components/admin/AdminOperationsWorkbench';

export const dynamic = 'force-dynamic';

export default function SecurityPage() {
    return <AdminOperationsWorkbench mode="security" />;
}
