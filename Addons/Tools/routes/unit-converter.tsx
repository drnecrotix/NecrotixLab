import { QuickWebTool } from '@addons/Tools/components/QuickWebTool'; import { ToolShell } from '@addons/Tools/components/ToolShell';
export default function Page() { return <ToolShell eyebrow="Conversion tools" title="Unit Converter" description="Convert length, mass, temperature, digital storage and angles from one compact tool."><QuickWebTool mode="units" /></ToolShell>; }
