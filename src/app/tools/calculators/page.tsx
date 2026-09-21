import { QuickWebTool } from '@/components/tools/QuickWebTool'; import { ToolShell } from '@/components/tools/ToolShell';
export default function Page() { return <ToolShell eyebrow="Calculation tools" title="Quick Calculators" description="Calculate count, sum, average and percentage values from a list of numbers."><QuickWebTool mode="calculators" /></ToolShell>; }
