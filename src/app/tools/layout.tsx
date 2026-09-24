import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SERVICE_TOOLS_CONFIG_SLUG, toolsActive } from '@addons/Tools/settings';

export default async function ToolsLayout({ children }: { children: React.ReactNode }) {
    const config = await prisma.page.findUnique({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, select: { content: true } }).catch(() => null);
    if (!toolsActive(config?.content)) notFound();
    return children;
}
