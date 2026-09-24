import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/subtitle-converter';

export default async function Page() {
    if (!(await addonToolEnabled('subtitle-converter'))) notFound();
    return <ToolPage />;
}
