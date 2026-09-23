import type { Metadata } from 'next';
import { ExifTool } from '@/components/tools/ExifTool';
import { ToolShell } from '@/components/tools/ToolShell';
export const metadata: Metadata = { title: 'EXIF Tool', description: 'Inspect photo EXIF, GPS, IPTC and XMP locally and download a metadata-free copy of supported images.' };
export default function Page() { return <ToolShell eyebrow="Image tools" title="EXIF Tool" description="Inspect camera, location and ownership metadata without uploading your image. Export the report or create a clean copy."><ExifTool /></ToolShell>; }
