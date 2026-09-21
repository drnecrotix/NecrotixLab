import { QuickWebTool } from '@/components/tools/QuickWebTool'; import { ToolShell } from '@/components/tools/ToolShell';
export default function Page() { return <ToolShell eyebrow="Developer tools" title="JSON Toolkit" description="Validate, format and minify JSON locally with readable errors."><QuickWebTool mode="json" /></ToolShell>; }
