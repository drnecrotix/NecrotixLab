import { QuickWebTool } from '@/components/tools/QuickWebTool'; import { ToolShell } from '@/components/tools/ToolShell';
export default function Page() { return <ToolShell eyebrow="Developer tools" title="URL & HTML Encoder" description="Encode or decode URL components and HTML entities without sending text to a server."><QuickWebTool mode="encoder" /></ToolShell>; }
