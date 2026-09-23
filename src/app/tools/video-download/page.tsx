import { VideoDownload } from '@/components/tools/VideoDownload';
import { ToolShell } from '@/components/tools/ToolShell';
export default function Page() { return <ToolShell eyebrow="Web tools" title="Video Download" description="Inspect a public X.com post and download an available MP4." processing="Server fetch from the public X embed feed; source URL sent to X"><VideoDownload /></ToolShell>; }
