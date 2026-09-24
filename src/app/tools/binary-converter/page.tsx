import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/binary-converter';
export { metadata } from '@addons/Tools/routes/binary-converter';

export default async function Page() {
    if (!(await addonToolEnabled('binary-converter'))) notFound();
    return <ToolPage />;
}
