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
    return <main className="min-h-screen bg-background px-5 pb-24 pt-28 text-foreground sm:px-8 lg:pt-36"><div className="mx-auto max-w-6xl"><BackToLabLink href="/lab" label="Back to Lab" /><header className="mt-6 rounded-3xl border border-border bg-card p-6 sm:p-9"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-500">NecrotixLab / Utility library</p><div className="mt-5 flex flex-wrap items-end justify-between gap-6"><div><h1 className="text-4xl font-black tracking-[-0.055em] sm:text-6xl">Tools</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">Find a practical utility for websites, files, media or CNC. Search the catalogue or browse by category.</p></div><Link href="/services" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:border-cyan-500 hover:text-cyan-500">Explore Services <ArrowRight className="size-4" /></Link></div></header><ToolsCatalog tools={tools} /></div></main>;
}
