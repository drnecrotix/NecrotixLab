import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/text-toolkit';

export default async function Page() {
    if (!(await addonToolEnabled('text-toolkit'))) notFound();
    return <ToolPage />;
}
