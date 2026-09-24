import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/dxf-inspector';

export default async function Page() {
    if (!(await addonToolEnabled('dxf-inspector'))) notFound();
    return <ToolPage />;
}
