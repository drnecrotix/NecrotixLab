import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/image-toolkit';

export default async function Page() {
    if (!(await addonToolEnabled('image-toolkit'))) notFound();
    return <ToolPage />;
}
