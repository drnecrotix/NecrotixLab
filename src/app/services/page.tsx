import type { Metadata } from 'next';
import Link from 'next/link';
import {
    ArrowRight,
    Binary,
    DraftingCompass,
    FileSearch,
    Globe2,
    LifeBuoy,
    MonitorSmartphone,
    Workflow,
} from 'lucide-react';
import { BackToLabLink } from '@/components/services/BackToLabLink';

export const metadata: Metadata = {
    title: 'Lab Services',
    description: 'Inspect an existing website, configure a new project or request WordPress and custom website support.',
    alternates: { canonical: '/services' },
};

const services = [
    { href: '/services/website', icon: Globe2, eyebrow: 'Project configurator', title: 'Create a website', description: 'Choose the scope, design, features and infrastructure, then receive an immediate indicative EUR estimate.', accent: 'text-violet-500', comingSoon: false },
    { href: '/services/support', icon: LifeBuoy, eyebrow: 'Ongoing or one-off help', title: 'Website support', description: 'Configure WordPress, WooCommerce or custom website support and maintenance with clear pricing.', accent: 'text-cyan-500', comingSoon: false },
    { href: '', icon: MonitorSmartphone, eyebrow: 'Coming soon', title: 'PC Services', description: 'Remote computer support for setup, troubleshooting, software and performance issues.', accent: 'text-violet-500', comingSoon: true },
] as const;

const engineeringServices = [
    { icon: DraftingCompass, title: 'Technical drawing', description: '2D technical drawings, dimensions, tolerances, layers and production-ready documentation.' },
    { icon: Binary, title: 'CNC program preparation', description: 'Turning and milling programs prepared around the drawing, material, machine and controller.' },
    { icon: FileSearch, title: 'Existing program review', description: 'Review and optimization of G-code structure, tool movement, feeds and program safety.' },
    { icon: Workflow, title: 'CAD to manufacturing', description: 'DXF or DWG preparation, operations, tooling strategy and setup documentation.' },
] as const;

export default function ServicesPage() {
    return (
        <main className="min-h-screen bg-background px-5 pb-24 pt-28 text-foreground sm:px-8 lg:pt-36">
            <div className="mx-auto max-w-6xl">
                <BackToLabLink />
                <header className="max-w-4xl">
                    <div className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-sky-500">Kreatrics / Services</div>
                    <h1 className="mt-5 text-4xl font-black tracking-[-0.055em] sm:text-5xl">Lab Services</h1>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">Website services and developing CAD and CNC capabilities. Free utilities have their own Tools page.</p>
                </header>
                <section className="mt-10 grid border-t border-border/80 md:grid-cols-2 xl:grid-cols-3">
                    {services.map(({ href, icon: Icon, eyebrow, title, description, accent, ...service }) => service.comingSoon ? (
                        <article key={title} className="border-b border-border/80 py-7 opacity-65 md:px-7 md:odd:border-r xl:border-r xl:first:pl-0 xl:last:border-r-0 xl:last:pr-0">
                            <Icon className={`size-5 ${accent}`} /><p className={`mt-8 font-mono text-[9px] font-bold uppercase tracking-[0.2em] ${accent}`}>{eyebrow}</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">{title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p><span className="mt-6 inline-flex border border-border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider">Coming soon</span>
                        </article>
                    ) : (
                        <Link key={href} href={href} className="group border-b border-border/80 py-7 transition hover:bg-muted/30 md:px-7 md:odd:border-r xl:border-r xl:first:pl-0 xl:last:border-r-0 xl:last:pr-0">
                            <Icon className={`size-5 ${accent}`} />
                            <p className={`mt-8 font-mono text-[9px] font-bold uppercase tracking-[0.2em] ${accent}`}>{eyebrow}</p>
                            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">{title}</h2>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
                            <span className="mt-6 inline-flex items-center gap-2 text-xs font-bold">Open service <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" /></span>
                        </Link>
                    ))}
                </section>
                <Link href="/services/pricing" className="mt-8 inline-flex items-center gap-2 text-xs font-bold text-sky-500 hover:underline">View the complete EUR pricing catalogue <ArrowRight className="size-3.5" /></Link>

                <section id="engineering" aria-labelledby="engineering-services-title" className="scroll-mt-28 pt-24">
                    <div className="grid gap-5 border-b border-border/80 pb-7 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
                        <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-amber-500">Engineering / Coming soon</p><h2 id="engineering-services-title" className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-4xl">CAD & CNC Services</h2></div>
                        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">A developing service line connecting technical drawings, machine logic and production preparation. Requests will open after the workflow and sample programs are validated.</p>
                    </div>
                    <div className="grid md:grid-cols-2 xl:grid-cols-4">
                        {engineeringServices.map(({ icon: Icon, title, description }) => (
                            <article key={title} className="border-b border-border/80 py-7 opacity-70 md:px-7 md:odd:border-r xl:border-r xl:first:pl-0 xl:last:border-r-0 xl:last:pr-0">
                                <Icon className="size-5 text-amber-500" /><p className="mt-8 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-amber-500">Engineering</p><h3 className="mt-2 text-xl font-black tracking-[-0.035em]">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p><span className="mt-6 inline-flex border border-border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider">Coming soon</span>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mt-20 flex flex-col gap-5 border border-border/80 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500">Free utilities</p><h2 className="mt-2 text-2xl font-black tracking-tight">Looking for Tools?</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Explore the free website, file, media and CNC tools in their own catalogue.</p></div>
                    <Link href="/tools" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-sm font-bold text-background">Open Tools <ArrowRight className="size-4" /></Link>
                </section>
            </div>
        </main>
    );
}
