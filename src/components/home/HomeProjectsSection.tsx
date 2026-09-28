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

    if (!leadProject) return null;

    return (
        <section id="home-projects" aria-labelledby="projects-title" className="scroll-mt-24 border-t border-foreground/10 bg-background px-6 py-16 md:px-16 md:py-20 lg:scroll-mt-28 lg:px-24 lg:py-24">
            <div className="mx-auto w-full max-w-[1400px]">
                <div className="mb-10 border-b border-foreground/10 pb-9">
                    <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div>
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{content.projectsEyebrow}</p>
                        <h2 id="projects-title" className="mt-4 max-w-[15ch] text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-foreground sm:text-5xl lg:text-6xl">{content.projectsStatement}</h2>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">{content.projectsDescription}</p>
                    </div>
                    <Link href="/projects" onClick={onProjectOpen} className="group inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-foreground/20 px-5 text-sm font-semibold transition-colors hover:border-foreground hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background lg:self-end">All projects <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" /></Link>
                    </div>
                </div>

                <motion.article initial={reduceMotion ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}>
                    <Link href={`/projects/${leadProject.slug}`} onClick={onProjectOpen} className="group grid overflow-hidden border border-foreground/10 bg-foreground/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background lg:grid-cols-[1.3fr_0.7fr]">
                        <ProjectImage project={leadProject} className="aspect-[16/10] lg:aspect-auto lg:min-h-[430px]" />
                        <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-3"><span className="font-mono text-[10px] text-muted-foreground">FEATURED / 01</span><ProjectStatusBadge status={leadProject.status} /></div>
                                <div className="mt-5"><ProjectMeta project={leadProject} /></div>
                                <h3 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.045em] transition-colors group-hover:text-primary sm:text-4xl">{leadProject.title}</h3>
                                <p className="mt-4 line-clamp-4 text-base leading-7 text-muted-foreground">{leadProject.description}</p>
                            </div>
                            <div className="mt-8">
                                {leadProject.techStack.length ? <p className="font-mono text-[9px] uppercase leading-5 tracking-[0.16em] text-muted-foreground">{leadProject.techStack.slice(0, 5).join(' / ')}</p> : null}
                                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">Read the case study <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
                            </div>
                        </div>
                    </Link>
                </motion.article>

                {supportingProjects.length ? (
                    <div className="mt-6 grid gap-5 lg:grid-cols-2">
                        {supportingProjects.map((project, index) => (
                            <motion.article key={project.id} initial={reduceMotion ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: reduceMotion ? 0 : 0.45, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }} className="min-w-0 border border-foreground/10">
                                <Link href={`/projects/${project.slug}`} onClick={onProjectOpen} className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background">
                                    <ProjectImage project={project} className="aspect-[16/9]" />
                                    <div className="p-5 sm:p-6">
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
