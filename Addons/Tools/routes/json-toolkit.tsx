import { QuickWebTool } from '@addons/Tools/components/QuickWebTool'; import { ToolShell } from '@addons/Tools/components/ToolShell';
export default function Page() { return <ToolShell eyebrow="Developer tools" title="JSON Toolkit" description="Validate, format and minify JSON locally with readable errors."><QuickWebTool mode="json" /></ToolShell>; }
