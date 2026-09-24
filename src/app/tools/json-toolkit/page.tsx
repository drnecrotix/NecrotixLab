import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/json-toolkit';

export default async function Page() {
    if (!(await addonToolEnabled('json-toolkit'))) notFound();
    return <ToolPage />;
}
