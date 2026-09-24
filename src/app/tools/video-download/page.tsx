import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/video-download';

export default async function Page() {
    if (!(await addonToolEnabled('social-video'))) notFound();
    return <ToolPage />;
}
