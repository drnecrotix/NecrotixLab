import { GCodeEditor } from '@/components/tools/GCodeEditor';
import { ToolShell } from '@/components/tools/ToolShell';
import { notFound } from 'next/navigation';
import { addonEnabled } from '@/lib/addons.server';

export default async function Page() {
    if (!(await addonEnabled('gcode-editor'))) notFound();
    return <ToolShell eyebrow="Engineering tools" title="G-Code Editor" description="Write, inspect and preview CNC programs locally, with line-level diagnostics and a command helper."><GCodeEditor /></ToolShell>;
}
