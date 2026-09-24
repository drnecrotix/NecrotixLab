import { DxfInspector } from '@addons/Tools/components/CadTools';
import { ToolShell } from '@addons/Tools/components/ToolShell';
export default function Page() { return <ToolShell eyebrow="Engineering tools" title="DXF Inspector" description="Inspect ASCII DXF entities, layers and drawing bounds with a local XY preview."><DxfInspector /></ToolShell>; }
