import type { Metadata } from 'next';
import { HexViewer } from '@/components/tools/HexViewer';
import { ToolShell } from '@/components/tools/ToolShell';

export const metadata: Metadata = { title: 'Hex Viewer', description: 'Inspect a file signature and its first bytes as hexadecimal locally.' };
export default function HexViewerPage() { return <ToolShell title="Hex Viewer" description="Inspect a file signature, MIME information, byte offsets, hexadecimal values and ASCII representation without uploading the file."><HexViewer /></ToolShell>; }
