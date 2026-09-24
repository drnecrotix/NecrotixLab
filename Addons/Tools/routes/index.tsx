import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { BackToLabLink } from '@/components/services/BackToLabLink';
import { ToolsCatalog } from '@addons/Tools/components/ToolsCatalog';
import { prisma } from '@/lib/prisma';
import { normalizeServiceTools, SERVICE_TOOLS_CONFIG_SLUG, toolsActive } from '@addons/Tools/settings';

export const metadata: Metadata = {
    title: 'Tools',
    description: 'Free website, file, media and CNC tools from NecrotixLab.',
    alternates: { canonical: '/tools' },
};

export default async function ToolsPage() {
    const config = await prisma.page.findUnique({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, select: { content: true } }).catch(() => null);
    if (!toolsActive(config?.content)) notFound();
    const tools = normalizeServiceTools(config?.content).filter((tool) => tool.visible);
    return <main className="min-h-screen bg-background px-5 pb-24 pt-28 text-foreground sm:px-8 lg:pt-36">
        <div className="mx-auto max-w-6xl">
            <BackToLabLink href="/lab" label="Back to Lab" />
            <header className="grid gap-6 border-b border-border/80 pb-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
                <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-500">NecrotixLab / Free utilities</p><h1 className="mt-4 text-4xl font-black tracking-[-0.055em] sm:text-5xl">Tools</h1></div>
                <div><p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">Practical tools for websites, files, video and CNC. Search or browse by category below.</p><Link href="/services" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-sky-500 hover:underline">Need project help? Explore Services <ArrowRight className="size-4" /></Link></div>
            </header>
            <ToolsCatalog tools={tools} />
        </div>
    </main>;
}
