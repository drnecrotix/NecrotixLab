import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BackToLabLink } from '@/components/services/BackToLabLink';
import { SupportedIcon } from '@/components/ui/SupportedIcon';
import { prisma } from '@/lib/prisma';
import { normalizeServiceTools, SERVICE_TOOLS_CONFIG_SLUG } from '@/modules/service-tools/settings';

export const metadata: Metadata = {
    title: 'Tools',
    description: 'Free website, file, media and CNC tools from NecrotixLab.',
    alternates: { canonical: '/tools' },
};

export default async function ToolsPage() {
    const config = await prisma.page.findUnique({ where: { slug: SERVICE_TOOLS_CONFIG_SLUG }, select: { content: true } }).catch(() => null);
    const tools = normalizeServiceTools(config?.content).filter((tool) => tool.visible);
    return <main className="min-h-screen bg-background px-5 pb-24 pt-28 text-foreground sm:px-8 lg:pt-36">
        <div className="mx-auto max-w-6xl">
            <BackToLabLink href="/lab" label="Back to Lab" />
            <header className="grid gap-6 border-b border-border/80 pb-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
                <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-500">NecrotixLab / Free utilities</p><h1 className="mt-4 text-4xl font-black tracking-[-0.055em] sm:text-5xl">Tools</h1></div>
                <div><p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">Practical tools for websites, files, video and CNC. Open an active tool below; muted tools are in preparation.</p><Link href="/services" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-sky-500 hover:underline">Need project help? Explore Services <ArrowRight className="size-4" /></Link></div>
            </header>
            <section aria-label="Available tools" className="mt-10 grid grid-cols-2 border-l border-t border-border/70 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {tools.map(({ id, href, icon, name, enabled, comingSoon }) => {
                    const available = enabled && Boolean(href);
                    const content = <><span className="relative"><SupportedIcon name={icon} className={`size-7 transition-transform ${available ? 'text-cyan-500 group-hover:-translate-y-1' : 'text-muted-foreground/55'}`} strokeWidth={1.5} />{comingSoon && <span className="absolute -right-2 -top-2 size-1.5 rounded-full bg-amber-500" aria-label="Coming soon" />}</span><span className={`mt-4 text-center text-xs font-semibold ${available ? 'text-foreground' : 'text-muted-foreground'}`}>{name}</span></>;
                    const className = 'group flex aspect-square min-h-32 flex-col items-center justify-center border-b border-r border-border/70 px-3 py-5 transition-colors';
                    return available ? <Link key={id} href={href} className={`${className} hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500`}>{content}</Link> : <div key={id} className={`${className} cursor-default bg-foreground/[0.015]`} title={comingSoon ? 'Coming soon' : 'Temporarily unavailable'}>{content}</div>;
                })}
            </section>
            <div className="mt-4 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground"><span className="size-1.5 rounded-full bg-amber-500" /> Coming soon</div>
        </div>
    </main>;
}
