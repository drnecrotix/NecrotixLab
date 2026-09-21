import type { Metadata } from 'next';
import { Base64Codec } from '@/components/tools/Base64Codec';
import { ToolShell } from '@/components/tools/ToolShell';

export const metadata: Metadata = { title: 'Base64 Encode and Decode', description: 'Encode UTF-8 text to Base64 or decode Base64 locally in your browser.' };
export default function Base64Page() { return <ToolShell title="Base64 Codec" description="Encode UTF-8 text to Base64 or decode Base64 back to readable text. Processing stays inside the browser."><Base64Codec /></ToolShell>; }
