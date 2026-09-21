import { QuickWebTool } from '@/components/tools/QuickWebTool'; import { ToolShell } from '@/components/tools/ToolShell';
export default function Page() { return <ToolShell eyebrow="Design tools" title="Color Converter" description="Select a color and translate it between HEX, RGB and HSL representations."><QuickWebTool mode="color" /></ToolShell>; }
