import { QuickWebTool } from '@/components/tools/QuickWebTool'; import { ToolShell } from '@/components/tools/ToolShell';
export default function Page() { return <ToolShell eyebrow="Web utilities" title="Text Toolkit" description="Count, normalize, sort and transform text locally in one focused workspace."><QuickWebTool mode="text" /></ToolShell>; }
