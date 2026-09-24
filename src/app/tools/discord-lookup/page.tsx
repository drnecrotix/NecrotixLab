import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/discord-lookup';
export { metadata } from '@addons/Tools/routes/discord-lookup';

export default async function Page() {
    if (!(await addonToolEnabled('discord-lookup'))) notFound();
    return <ToolPage />;
}
