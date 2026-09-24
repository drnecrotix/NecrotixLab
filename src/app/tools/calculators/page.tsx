import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/calculators';

export default async function Page() {
    if (!(await addonToolEnabled('calculator-toolkit'))) notFound();
    return <ToolPage />;
}
