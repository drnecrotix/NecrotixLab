import { QuickWebTool } from '@addons/Tools/components/QuickWebTool'; import { ToolShell } from '@addons/Tools/components/ToolShell';
export default function Page() { return <ToolShell eyebrow="Content tools" title="VTT / SRT Converter" description="Convert common subtitle timing formats locally while keeping the text editable."><QuickWebTool mode="subtitles" /></ToolShell>; }
