import { SvgToGCode } from '@addons/Tools/components/CadTools';
import { ToolShell } from '@addons/Tools/components/ToolShell';
export default function Page() { return <ToolShell eyebrow="Engineering tools" title="SVG to G-code" description="Convert vector outlines to a sampled XY toolpath with editable cutting parameters."><SvgToGCode /></ToolShell>; }
