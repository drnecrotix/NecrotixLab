import { SvgToGCode } from '@/components/tools/CadTools';
import { ToolShell } from '@/components/tools/ToolShell';
export default function Page() { return <ToolShell eyebrow="Engineering tools" title="SVG to G-code" description="Convert vector outlines to a sampled XY toolpath with editable cutting parameters."><SvgToGCode /></ToolShell>; }
