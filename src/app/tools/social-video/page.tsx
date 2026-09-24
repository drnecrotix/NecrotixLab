import { notFound, redirect } from 'next/navigation';
import { addonToolEnabled } from '@/lib/addons.server';

export default async function Page() {
    if (!(await addonToolEnabled('social-video'))) notFound();
    redirect('/tools/video-download');
}
