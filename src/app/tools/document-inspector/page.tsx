import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/document-inspector';
export { metadata } from '@addons/Tools/routes/document-inspector';

export default async function Page() {
    if (!(await addonToolEnabled('document-inspector'))) notFound();
    return <ToolPage />;
}
