import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/unit-converter';

export default async function Page() {
    if (!(await addonToolEnabled('unit-converter'))) notFound();
    return <ToolPage />;
}
