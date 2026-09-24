import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/svg-to-gcode';

export default async function Page() {
    if (!(await addonToolEnabled('svg-to-gcode'))) notFound();
    return <ToolPage />;
}
