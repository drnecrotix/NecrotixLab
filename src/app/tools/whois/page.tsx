import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/whois';

export default async function Page() {
    if (!(await addonToolEnabled('whois'))) notFound();
    return <ToolPage />;
}
