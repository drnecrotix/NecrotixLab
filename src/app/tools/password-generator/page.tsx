import { QuickWebTool } from '@/components/tools/QuickWebTool'; import { ToolShell } from '@/components/tools/ToolShell';
export default function Page() { return <ToolShell eyebrow="Security tools" title="Password Generator" description="Create strong random passwords using the browser cryptography API. Generated values never leave the page."><QuickWebTool mode="password" /></ToolShell>; }
