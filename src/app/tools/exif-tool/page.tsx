import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/exif-tool';
export { metadata } from '@addons/Tools/routes/exif-tool';

export default async function Page() {
    if (!(await addonToolEnabled('exif-tool'))) notFound();
    return <ToolPage />;
}
