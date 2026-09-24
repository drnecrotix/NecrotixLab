import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/hex-viewer';
export { metadata } from '@addons/Tools/routes/hex-viewer';

export default async function Page() {
    if (!(await addonToolEnabled('hex-viewer'))) notFound();
    return <ToolPage />;
}
