import { QuickWebTool } from '@/components/tools/QuickWebTool'; import { ToolShell } from '@/components/tools/ToolShell';
export default function Page() { return <ToolShell eyebrow="Developer tools" title="UUID Generator" description="Generate cryptographically random UUID v4 identifiers locally."><QuickWebTool mode="uuid" /></ToolShell>; }
