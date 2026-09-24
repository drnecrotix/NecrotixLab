import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/web-encoder';

export default async function Page() {
    if (!(await addonToolEnabled('web-encoder'))) notFound();
    return <ToolPage />;
}
