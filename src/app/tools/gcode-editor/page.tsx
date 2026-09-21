import { GCodeEditor } from '@/components/tools/GCodeEditor';
import { ToolShell } from '@/components/tools/ToolShell';

export default function Page() {
    return <ToolShell eyebrow="Engineering tools" title="G-Code Editor" description="Write, inspect and preview CNC programs locally, with line-level diagnostics and a command helper."><GCodeEditor /></ToolShell>;
}
