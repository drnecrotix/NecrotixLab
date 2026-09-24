import { QuickWebTool } from '@addons/Tools/components/QuickWebTool'; import { ToolShell } from '@addons/Tools/components/ToolShell';
export default function Page() { return <ToolShell eyebrow="Web utilities" title="Text Toolkit" description="Count, normalize, sort and transform text locally in one focused workspace."><QuickWebTool mode="text" /></ToolShell>; }
