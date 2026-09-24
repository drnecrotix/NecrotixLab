import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/password-generator';

export default async function Page() {
    if (!(await addonToolEnabled('password-generator'))) notFound();
    return <ToolPage />;
}
