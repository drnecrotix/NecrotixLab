import type { Metadata } from 'next';
import { ExifTool } from '@addons/Tools/components/ExifTool';
import { ToolShell } from '@addons/Tools/components/ToolShell';
import { notFound } from 'next/navigation';
import { addonEnabled } from '@/lib/addons.server';
export const metadata: Metadata = { title: 'EXIF Tool', description: 'Inspect photo EXIF, GPS, IPTC and XMP locally and download a metadata-free copy of supported images.' };
export default async function Page() { if (!(await addonEnabled('exif-tool'))) notFound(); return <ToolShell eyebrow="Image tools" title="EXIF Tool" description="Inspect camera, location and ownership metadata without uploading your image. Export the report or create a clean copy."><ExifTool /></ToolShell>; }
