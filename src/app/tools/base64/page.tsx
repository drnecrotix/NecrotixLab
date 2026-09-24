import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/base64';
export { metadata } from '@addons/Tools/routes/base64';

export default async function Page() {
    if (!(await addonToolEnabled('base64-codec'))) notFound();
    return <ToolPage />;
}
