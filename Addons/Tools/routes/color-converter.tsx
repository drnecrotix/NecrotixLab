import { QuickWebTool } from '@addons/Tools/components/QuickWebTool'; import { ToolShell } from '@addons/Tools/components/ToolShell';
export default function Page() { return <ToolShell eyebrow="Design tools" title="Color Converter" description="Select a color and translate it between HEX, RGB and HSL representations."><QuickWebTool mode="color" /></ToolShell>; }
