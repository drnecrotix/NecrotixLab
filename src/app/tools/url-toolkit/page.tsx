import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/url-toolkit';

export default async function Page() {
    if (!(await addonToolEnabled('url-toolkit'))) notFound();
    return <ToolPage />;
}
