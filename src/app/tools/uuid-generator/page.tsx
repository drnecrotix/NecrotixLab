import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/uuid-generator';

export default async function Page() {
    if (!(await addonToolEnabled('uuid-generator'))) notFound();
    return <ToolPage />;
}
