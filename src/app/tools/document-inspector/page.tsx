import type { Metadata } from 'next';
import { DocumentInspector } from '@/components/tools/DocumentInspector';
import { ToolShell } from '@/components/tools/ToolShell';

export const metadata: Metadata = { title: 'Document Inspector & Privacy Cleaner', description: 'Inspect document metadata and create privacy-clean PDF and image copies locally in your browser.' };
export default function DocumentInspectorPage() { return <ToolShell eyebrow="Document tools" title="Document Inspector & Privacy Cleaner" description="Review file signatures, metadata, privacy signals, PDF active-content markers and SHA-256. Create a sanitized PDF or image copy without uploading the original."><DocumentInspector /></ToolShell>; }
