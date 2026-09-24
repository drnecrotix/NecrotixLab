import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/color-converter';

export default async function Page() {
    if (!(await addonToolEnabled('color-converter'))) notFound();
    return <ToolPage />;
}
