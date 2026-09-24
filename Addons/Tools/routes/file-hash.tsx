import type { Metadata } from 'next';
import { FileHashTool } from '@addons/Tools/components/FileHashTool';
import { ToolShell } from '@addons/Tools/components/ToolShell';

export const metadata: Metadata = { title: 'File Hash Generator', description: 'Calculate SHA-256, SHA-384 and SHA-512 file hashes locally.' };
export default function FileHashPage() { return <ToolShell title="File Hash" description="Generate checksums for verifying downloads and comparing files. Files are processed locally and are never uploaded."><FileHashTool /></ToolShell>; }
