'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Braces, MessageCircleMore, Palette, ScanSearch } from 'lucide-react';
import type { Project } from '@/types';

const capabilities = [
    { number: '01', title: 'Digital products', description: 'Websites, dashboards, portals and focused tools built around a real workflow.', note: 'Design / Development / Systems', icon: Braces, href: '/projects' },
    { number: '02', title: 'Communities & systems', description: 'Discord ecosystems, automation and infrastructure that help communities grow.', note: 'Community / Automation / Operations', icon: MessageCircleMore, href: '/wiki/bg-gamer' },
    { number: '03', title: 'Visual stories', description: 'Digital art, photography and editorial experiences with a distinct identity.', note: 'Art direction / Content / Interaction', icon: Palette, href: '/gallery' },
] as const;

const services = [
    { title: 'Build something new', description: 'A website, portal or digital tool shaped from idea to a usable release.', deliverable: 'Strategy + design + development', href: '/services' },
    { title: 'Improve what exists', description: 'A practical review of usability, performance, accessibility and technical health.', deliverable: 'Audit + priorities + implementation', href: '/website-inspector' },
    { title: 'Shape a community', description: 'Structure, permissions, automation and tools for a safer community ecosystem.', deliverable: 'Architecture + setup + operations', href: '/services' },
    { title: 'Create a visual experience', description: 'A visual identity, editorial story or interactive presentation made to be remembered.', deliverable: 'Direction + assets + experience', href: '/contact' },
] as const;

function EditorialLabel({ children }: { children: ReactNode }) {
    return <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{children}</p>;
}

export function HomeCapabilitiesSection() {
    const reduceMotion = useReducedMotion();

    return (
        <section aria-labelledby="capabilities-title" className="border-t border-foreground/10 bg-background px-6 py-16 md:px-16 md:py-20 lg:px-24 lg:py-24">
            <div className="mx-auto w-full max-w-[1400px]">
                <div className="grid gap-8 border-b border-foreground/10 pb-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
                    <div>
                        <EditorialLabel>NecrotixLab / Independent digital studio</EditorialLabel>
                        <h2 id="capabilities-title" className="mt-5 max-w-[12ch] text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-foreground sm:text-5xl lg:text-6xl">Ideas made useful, visual and real.</h2>
                    </div>
                    <div className="flex max-w-2xl flex-col justify-end lg:pb-1">
                        <p className="text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-9">NecrotixLab is the independent practice of Dr. Necrotix - building digital products, community systems and visual stories from Bulgaria.</p>
                        <div className="mt-7 flex flex-wrap gap-3">
                            <Link href="/contact" className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transform-none">Start a project <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
                            <Link href="/projects" className="inline-flex min-h-11 items-center rounded-full border border-foreground/15 px-5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background">Explore the work</Link>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3">
                    {capabilities.map((capability, index) => {
                        const Icon = capability.icon;
                        return (
                            <motion.article key={capability.title} initial={reduceMotion ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: reduceMotion ? 0 : 0.45, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }} className="group relative border-b border-foreground/10 py-8 lg:border-b-0 lg:border-r lg:px-8 lg:py-10 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0">
                                <div className="flex items-center justify-between"><span className="font-mono text-[11px] text-muted-foreground">{capability.number}</span><Icon aria-hidden="true" className="size-5 text-foreground/45 transition-colors group-hover:text-foreground" strokeWidth={1.5} /></div>
                                <h3 className="mt-12 text-2xl font-semibold tracking-[-0.035em] text-foreground">{capability.title}</h3>
                                <p className="mt-3 max-w-sm text-[15px] leading-7 text-muted-foreground">{capability.description}</p>
                                <div className="mt-8 flex items-end justify-between gap-4 border-t border-foreground/10 pt-4">
                                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{capability.note}</span>
                                    <Link href={capability.href} aria-label={`Explore ${capability.title}`} className="grid size-9 shrink-0 place-items-center rounded-full border border-foreground/15 transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ArrowUpRight className="size-4" /></Link>
                                </div>
                            </motion.article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export function HomeServicesAndLabSection({ projects }: { projects: Project[] }) {
    const activeProjects = projects.filter((project) => project.status === 'ongoing' || project.status === 'planned').slice(0, 3);

    return (
        <>
            <section aria-labelledby="services-title" className="border-t border-foreground/10 bg-foreground text-background">
                <div className="mx-auto grid w-full max-w-[1600px] lg:grid-cols-[0.72fr_1.28fr]">
                    <div className="flex flex-col justify-between border-b border-background/15 px-6 py-14 md:px-16 md:py-20 lg:border-b-0 lg:border-r lg:px-20 lg:py-24">
                        <div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-background/50">Services / Ways I can help</p><h2 id="services-title" className="mt-5 max-w-[9ch] text-4xl font-semibold leading-none tracking-[-0.055em] sm:text-5xl lg:text-6xl">From rough idea to working system.</h2></div>
                        <div className="mt-12"><p className="max-w-md text-base leading-7 text-background/60">One creator across strategy, visual direction and implementation. Clear scope, direct communication and no agency layers.</p><Link href="/services" className="group mt-7 inline-flex min-h-11 items-center gap-2 border-b border-background/30 text-sm font-semibold transition-colors hover:border-background">View services <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link></div>
                    </div>
                    <div>
                        {services.map((service, index) => (
                            <Link key={service.title} href={service.href} className="group grid gap-4 border-b border-background/15 px-6 py-8 transition-colors last:border-b-0 hover:bg-background/[0.06] md:grid-cols-[54px_minmax(0,1fr)_220px_28px] md:items-center md:px-12 lg:px-16">
                                <span className="font-mono text-[11px] text-background/35">{String(index + 1).padStart(2, '0')}</span>
                                <div><h3 className="text-xl font-semibold tracking-[-0.025em] sm:text-2xl">{service.title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-background/55">{service.description}</p></div>
                                <p className="font-mono text-[9px] uppercase leading-5 tracking-[0.16em] text-background/45">{service.deliverable}</p>
                                <ArrowUpRight className="size-5 text-background/45 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-background" />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section aria-labelledby="lab-title" className="border-t border-foreground/10 bg-background px-6 py-16 md:px-16 md:py-20 lg:px-24 lg:py-24">
                <div className="mx-auto grid w-full max-w-[1400px] gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
                    <div>
                        <div className="flex items-center gap-3"><span aria-hidden="true" className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-45 motion-reduce:animate-none" /><span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" /></span><EditorialLabel>Now in the lab</EditorialLabel></div>
                        <h2 id="lab-title" className="mt-5 text-4xl font-semibold leading-none tracking-[-0.05em] sm:text-5xl">Work in motion.</h2>
                        <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">Experiments, active builds and ideas currently moving through NecrotixLab.</p>
                    </div>
                    <div className="border-t border-foreground/10">
                        {activeProjects.length ? activeProjects.map((project, index) => (
                            <Link key={project.id} href={`/projects/${project.slug}`} className="group grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-4 border-b border-foreground/10 py-6 sm:grid-cols-[52px_minmax(0,1fr)_120px_24px]">
                                <span className="font-mono text-[10px] text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                                <div className="min-w-0"><h3 className="truncate text-lg font-semibold tracking-tight group-hover:text-primary sm:text-xl">{project.title}</h3><p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{project.category || project.description}</p></div>
                                <span className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400 sm:block">{project.status === 'ongoing' ? 'Building' : 'Exploring'}</span>
                                <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                            </Link>
                        )) : <div className="border-b border-foreground/10 py-8"><p className="text-sm leading-6 text-muted-foreground">The next experiment is being prepared. Explore the archive in the meantime.</p></div>}
                        <Link href="/lab" className="group mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground/70 hover:text-foreground">Enter the lab <ScanSearch className="size-4 transition-transform group-hover:scale-110" /></Link>
                    </div>
                </div>
            </section>

            <section aria-labelledby="contact-title" className="border-y border-foreground/10 bg-[linear-gradient(135deg,hsl(var(--foreground)/0.035),transparent_62%)] px-6 py-20 md:px-16 md:py-28 lg:px-24 lg:py-32">
                <div className="mx-auto flex w-full max-w-[1400px] flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
                    <div><EditorialLabel>Open channel / New projects</EditorialLabel><h2 id="contact-title" className="mt-5 max-w-[14ch] text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-foreground sm:text-6xl lg:text-7xl">Have an unusual digital idea?</h2></div>
                    <div className="max-w-md"><p className="text-base leading-7 text-muted-foreground">Tell me what you are trying to build, improve or communicate. We can begin with the problem, not a finished brief.</p><Link href="/contact" className="group mt-7 inline-flex min-h-12 items-center gap-3 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transform-none">Start a conversation <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link></div>
                </div>
            </section>
        </>
    );
}
