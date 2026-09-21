import { ImageToolkit } from '@/components/tools/ImageToolkit'; import { ToolShell } from '@/components/tools/ToolShell';
export default function Page() { return <ToolShell eyebrow="Image tools" title="Image Toolkit" description="Resize, rotate, flip and convert images to PNG, JPEG or WebP entirely in the browser."><ImageToolkit /></ToolShell>; }
