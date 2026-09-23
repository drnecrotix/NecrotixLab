import { VideoDownload } from '@/components/tools/VideoDownload';
import { ToolShell } from '@/components/tools/ToolShell';
export default function Page() { return <ToolShell eyebrow="Web tools" title="Video Download" description="Inspect a public Facebook, Instagram or X post and download an available MP4 with audio." processing="Server processing with yt-dlp; source URL sent to the platform"><VideoDownload /></ToolShell>; }
