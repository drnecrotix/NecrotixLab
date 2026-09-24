import { QuickWebTool } from '@addons/Tools/components/QuickWebTool'; import { ToolShell } from '@addons/Tools/components/ToolShell';
export default function Page() { return <ToolShell eyebrow="Developer tools" title="UUID Generator" description="Generate cryptographically random UUID v4 identifiers locally."><QuickWebTool mode="uuid" /></ToolShell>; }
