import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/gcode-editor';

export default async function Page() {
    if (!(await addonToolEnabled('gcode-editor'))) notFound();
    return <ToolPage />;
}
