import { QuickWebTool } from '@/components/tools/QuickWebTool'; import { ToolShell } from '@/components/tools/ToolShell';
export default function Page() { return <ToolShell eyebrow="Website tools" title="URL Parser & UTM Builder" description="Inspect URL components and generate a consistent UTM-tagged campaign link."><QuickWebTool mode="url" /></ToolShell>; }
