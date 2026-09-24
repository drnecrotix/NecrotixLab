import Link from 'next/link';
import { ProjectForm } from '@/components/admin/ProjectForm';
import { createProject } from '../actions';
import { getProjectCategoryNames } from '@/lib/project-categories';

export const dynamic = 'force-dynamic';

export default async function NewProjectPage() {
    const categories = await getProjectCategoryNames();

    return (
        <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-end justify-between gap-4">
                <div><p className="text-xs uppercase tracking-[0.3em] text-white/35">Projects</p><h2 className="mt-2 text-4xl font-semibold">New project</h2></div>
                <Link href="/admin/projects" className="text-sm text-white/45 hover:text-white">Back to projects</Link>
            </div>
            <ProjectForm categories={categories} action={createProject} submitLabel="Create project" />
        </div>
    );
}
