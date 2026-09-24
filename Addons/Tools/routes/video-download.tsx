import { VideoDownload } from '@addons/Tools/components/VideoDownload';
import { ToolShell } from '@addons/Tools/components/ToolShell';
import { notFound } from 'next/navigation';
import { addonEnabled } from '@/lib/addons.server';
export default async function Page() { if (!(await addonEnabled('social-video'))) notFound(); return <ToolShell eyebrow="Web tools" title="Video Download" description="Inspect a public X, Threads, or YouTube video and download an available MP4." processing="Server requests the public page or player data from the selected platform; source URL is sent to that platform"><VideoDownload /></ToolShell>; }
