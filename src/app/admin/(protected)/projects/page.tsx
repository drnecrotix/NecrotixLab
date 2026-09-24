import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { normalizeProjectStatus } from '@/lib/project-status';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';

export const dynamic = 'force-dynamic';

export default async function AdminProjectsPage() {
    const projects = await prisma.project.findMany({
        orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
        include: { _count: { select: { revisions: true } } },
    });

    return (
        <div className="mx-auto max-w-7xl">
            <div className="mb-7 flex flex-col gap-5 md:mb-8 md:flex-row md:items-end md:justify-between">
                <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Content</p>
                    <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Projects</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Projects created here drive the public projects archive and detail pages.</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:self-start md:self-auto">
                    <Link href="/admin/blog/taxonomies" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-foreground/10 px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-foreground/[0.04] hover:text-foreground">Types & Categories</Link>
                    <Link href="/admin/projects/new" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background">New project</Link>
                </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.015]">
                {projects.length === 0 ? (
                    <div className="px-5 py-14 text-center text-sm leading-6 text-muted-foreground">No CMS projects yet. Until the first one is created, the public site keeps using the existing portfolio data.</div>
                ) : (
                    <div>
                        {projects.map((project) => (
                            <Link key={project.id} href={`/admin/projects/${project.id}`} className="block border-b border-foreground/10 p-4 transition-colors last:border-b-0 hover:bg-foreground/[0.035] sm:p-5 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-5">
                                <div className="min-w-0">
                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                        <h3 className="mr-1 min-w-0 break-words text-lg font-semibold sm:text-xl">{project.title}</h3>
                                        <span className="max-w-full break-words rounded-full border border-sky-500/20 bg-sky-500/[0.06] px-2 py-1 text-[10px] uppercase tracking-wider text-sky-600 dark:text-sky-300">{project.category || 'Uncategorized'}</span>
                                        <ProjectStatusBadge status={normalizeProjectStatus(project.status)} />
                                    </div>
                                    <p className="mt-1 truncate text-xs text-muted-foreground sm:text-sm">/{project.slug}</p>
                                </div>
                                <p className="mt-3 whitespace-nowrap text-xs text-muted-foreground md:mt-0 md:text-right">{project._count.revisions} revisions</p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
