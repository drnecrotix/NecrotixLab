import { notFound } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';
import ToolPage from '@addons/Tools/routes/url-scam-check';
export default async function Page() { if (!(await addonToolEnabled('url-scam-check'))) notFound(); return <ToolPage />; }
