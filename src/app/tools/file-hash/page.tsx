import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/file-hash';
export { metadata } from '@addons/Tools/routes/file-hash';

export default async function Page() {
    if (!(await addonToolEnabled('file-hash'))) notFound();
    return <ToolPage />;
}
