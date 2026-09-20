'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Project } from '@/types';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import type { HomepageContent } from '@/lib/homepage-content';

type Props = { projects: Project[]; content: HomepageContent; onProjectOpen?: () => void };

function ProjectImage({ project, className = '' }: { project: Project; className?: string }) {
    return (
        <div className={`relative overflow-hidden bg-foreground/[0.035] ${className}`}>
            {project.image ? (
                <img src={project.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-[transform,filter] duration-700 ease-out group-hover:scale-[1.025] group-hover:brightness-110 motion-reduce:transform-none motion-reduce:transition-none" />
            ) : (
                <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--foreground)/0.08),transparent_55%)]" />
            )}
        </div>
    );
}

function ProjectMeta({ project }: { project: Project }) {
    const details = [project.role, project.category, project.startDate ? new Date(project.startDate).getFullYear() : null].filter(Boolean);
    return (
        <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground sm:text-[10px]">
            {details.map((detail, index) => (
                <span key={`${detail}-${index}`} className="contents">
                    {index > 0 ? <span aria-hidden="true" className="text-foreground/20">/</span> : null}
                    <span>{detail}</span>
                </span>
            ))}
        </div>
    );
}

export function HomeProjectsSection({ projects, content, onProjectOpen }: Props) {
    const reduceMotion = useReducedMotion();
    const priority = { completed: 0, ongoing: 1, planned: 2, archived: 3 } as const;
    const preferredProjects = [...projects].sort((a, b) => priority[a.status] - priority[b.status]).slice(0, Math.min(3, content.homeProjectLimit));
    const [leadProject, ...supportingProjects] = preferredProjects;
    const completedInSelection = preferredProjects.filter((project) => project.status === 'completed').length;

    if (!leadProject) return null;

    return (
        <section id="home-projects" aria-labelledby="projects-title" className="scroll-mt-24 border-t border-foreground/10 bg-background px-6 py-16 md:px-16 md:py-20 lg:scroll-mt-28 lg:px-24 lg:py-24">
            <div className="mx-auto w-full max-w-[1400px]">
                <div className="relative mb-10 overflow-hidden border-b border-foreground/10 pb-8">
                    <div aria-hidden="true" className="absolute -right-24 -top-28 size-72 rounded-full border border-foreground/[0.06]" />
                    <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div>
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{content.projectsEyebrow}</p>
                        <h2 id="projects-title" className="mt-4 max-w-[11ch] text-5xl font-semibold leading-[0.92] tracking-[-0.065em] text-foreground sm:text-6xl lg:text-7xl">{content.projectsStatement}</h2>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">{content.projectsDescription}</p>
                    </div>
                    <div className="flex flex-col items-start gap-5 lg:items-end"><div className="grid grid-cols-3 border-y border-foreground/10 text-left lg:min-w-[390px]">{[[String(preferredProjects.length).padStart(2, '0'), 'Selected'], [String(completedInSelection).padStart(2, '0'), 'Completed'], ['01', 'Featured']].map(([value, label]) => <div key={label} className="border-r border-foreground/10 px-4 py-4 last:border-r-0"><strong className="block font-mono text-lg font-medium tabular-nums">{value}</strong><span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">{label}</span></div>)}</div><Link href="/projects" onClick={onProjectOpen} className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground/65 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background">Explore the complete archive <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link></div>
                    </div>
                </div>

                <motion.article initial={reduceMotion ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}>
                    <Link href={`/projects/${leadProject.slug}`} onClick={onProjectOpen} className="group grid border-b border-foreground/10 pb-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background lg:grid-cols-[1.42fr_0.58fr] lg:gap-12">
                        <ProjectImage project={leadProject} className="aspect-[16/10] border border-foreground/10" />
                        <div className="flex flex-col justify-between pt-7 lg:py-2">
                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-3"><span className="font-mono text-[10px] text-muted-foreground">FEATURED / 01</span><ProjectStatusBadge status={leadProject.status} /></div>
                                <div className="mt-5"><ProjectMeta project={leadProject} /></div>
                                <h3 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.045em] transition-colors group-hover:text-primary sm:text-4xl">{leadProject.title}</h3>
                                <p className="mt-4 text-base leading-7 text-muted-foreground">{leadProject.description}</p>
                            </div>
                            <div className="mt-8">
                                {leadProject.techStack.length ? <p className="font-mono text-[9px] uppercase leading-5 tracking-[0.16em] text-muted-foreground">{leadProject.techStack.slice(0, 5).join(' / ')}</p> : null}
                                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Read the case study <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
                            </div>
                        </div>
                    </Link>
                </motion.article>

                {supportingProjects.length ? (
                    <div className="grid gap-0 lg:grid-cols-2">
                        {supportingProjects.map((project, index) => (
                            <motion.article key={project.id} initial={reduceMotion ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: reduceMotion ? 0 : 0.45, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }} className="border-b border-foreground/10 lg:border-r lg:odd:pr-8 lg:even:border-r-0 lg:even:pl-8">
                                <Link href={`/projects/${project.slug}`} onClick={onProjectOpen} className="group block py-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background">
                                    <ProjectImage project={project} className="aspect-[16/9] border border-foreground/10" />
                                    <div className="pt-6">
                                        <div className="flex flex-wrap items-center justify-between gap-3"><ProjectMeta project={project} /><ProjectStatusBadge status={project.status} /></div>
                                        <div className="mt-4 flex items-start justify-between gap-5">
                                            <div><h3 className="text-2xl font-semibold tracking-[-0.035em] transition-colors group-hover:text-primary">{project.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{project.description}</p></div>
                                            <ArrowUpRight className="mt-1 size-5 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.article>
                        ))}
                    </div>
                ) : null}
            </div>
        </section>
    );
}
