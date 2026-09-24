import { ImageToolkit } from '@addons/Tools/components/ImageToolkit'; import { ToolShell } from '@addons/Tools/components/ToolShell';
export default function Page() { return <ToolShell eyebrow="Image tools" title="Image Toolkit" description="Resize, rotate, flip and convert images to PNG, JPEG or WebP entirely in the browser."><ImageToolkit /></ToolShell>; }
