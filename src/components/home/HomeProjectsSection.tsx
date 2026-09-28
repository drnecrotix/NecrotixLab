'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Project } from '@/types';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import type { HomepageContent } from '@/lib/homepage-content';
import type { ReactNode } from 'react';

type Props = { projects: Project[]; content: HomepageContent; onProjectOpen?: () => void };

function ProjectImage({ project, className = '', children }: { project: Project; className?: string; children?: ReactNode }) {
    return (
        <div className={`relative overflow-hidden bg-foreground/[0.035] ${className}`}>
            {project.image ? (
                <img src={project.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transform-none" />
            ) : (
                <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--foreground)/0.08),transparent_55%)]" />
            )}
            {children}
        </div>
    );
}

function ProjectMeta({ project }: { project: Project }) {
    const details = [project.role, project.category, project.startDate ? new Date(project.startDate).getFullYear() : null].filter(Boolean);
    return (
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
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

    if (!leadProject) return null;

    return (
        <section id="home-projects" aria-labelledby="projects-title" className="scroll-mt-24 border-t border-foreground/10 bg-background px-6 py-16 md:px-16 md:py-20 lg:scroll-mt-28 lg:px-24 lg:py-24">
            <div className="mx-auto w-full max-w-[1400px]">
                <div className="mb-10 grid gap-7 border-b border-foreground/10 pb-10 md:grid-cols-[minmax(0,1fr)_minmax(250px,0.7fr)] md:items-end lg:mb-12">
                    <div>
                        <p className="flex items-center gap-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-500"><span aria-hidden="true" className="h-px w-8 bg-sky-500" />{content.projectsEyebrow}</p>
                        <h2 id="projects-title" className="mt-5 max-w-[16ch] text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-foreground sm:text-5xl lg:text-6xl">{content.projectsStatement}</h2>
                    </div>
                    <div className="md:pb-1">
                        <p className="max-w-lg text-base leading-7 text-muted-foreground">{content.projectsDescription}</p>
                        <Link href="/projects" onClick={onProjectOpen} className="group mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline decoration-foreground/25 underline-offset-8 transition-colors hover:text-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background">View all projects <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" /></Link>
                    </div>
                </div>

                <motion.article initial={reduceMotion ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}>
                    <Link href={`/projects/${leadProject.slug}`} onClick={onProjectOpen} className="group grid overflow-hidden border border-foreground/10 bg-foreground/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background lg:grid-cols-[minmax(0,1.25fr)_minmax(330px,0.75fr)]">
                        <ProjectImage project={leadProject} className="aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto lg:min-h-[480px]">
                            <span className="absolute bottom-5 left-5 bg-background/90 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground backdrop-blur-sm sm:bottom-7 sm:left-7">Featured project / 01</span>
                        </ProjectImage>
                        <div className="flex flex-col justify-between border-t border-foreground/10 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10 xl:p-12">
                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-3"><ProjectMeta project={leadProject} /><ProjectStatusBadge status={leadProject.status} /></div>
                                <h3 className="mt-10 text-3xl font-semibold leading-[1.08] tracking-[-0.045em] transition-colors group-hover:text-sky-500 sm:text-4xl xl:text-5xl">{leadProject.title}</h3>
                                <p className="mt-5 line-clamp-4 text-base leading-7 text-muted-foreground">{leadProject.description}</p>
                            </div>
                            <div className="mt-10 border-t border-foreground/10 pt-6">
                                {leadProject.techStack.length ? <p className="mb-5 line-clamp-2 font-mono text-[10px] uppercase leading-5 tracking-[0.12em] text-muted-foreground">{leadProject.techStack.slice(0, 4).join(' / ')}</p> : null}
                                <span className="inline-flex min-h-11 items-center gap-3 text-sm font-semibold">Explore project <span className="flex size-9 items-center justify-center rounded-full border border-foreground/20 transition-colors group-hover:border-sky-500 group-hover:bg-sky-500 group-hover:text-white"><ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" /></span></span>
                            </div>
                        </div>
                    </Link>
                </motion.article>

                {supportingProjects.length ? (
                    <div className="mt-5 grid gap-5 lg:grid-cols-2">
                        {supportingProjects.map((project, index) => (
                            <motion.article key={project.id} initial={reduceMotion ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: reduceMotion ? 0 : 0.45, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }} className="min-w-0 border border-foreground/10">
                                <Link href={`/projects/${project.slug}`} onClick={onProjectOpen} className="group grid h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:grid-cols-[minmax(140px,0.85fr)_minmax(0,1.15fr)]">
                                    <ProjectImage project={project} className="aspect-[16/10] sm:aspect-auto sm:min-h-[230px]" />
                                    <div className="flex min-w-0 flex-col justify-between border-t border-foreground/10 p-5 sm:border-l sm:border-t-0 sm:p-6">
                                        <div><div className="flex flex-wrap items-center gap-3"><ProjectMeta project={project} /><ProjectStatusBadge status={project.status} /></div><h3 className="mt-5 text-xl font-semibold leading-tight tracking-[-0.035em] transition-colors group-hover:text-sky-500 sm:text-2xl">{project.title}</h3><p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{project.description}</p></div>
                                        <div className="mt-5 flex items-center justify-between border-t border-foreground/10 pt-4 text-xs font-semibold uppercase tracking-[0.1em]">View project <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" /></div>
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
