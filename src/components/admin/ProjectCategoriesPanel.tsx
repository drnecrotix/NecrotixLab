import {
    createProjectCategory,
    deleteProjectCategory,
    updateProjectCategory,
} from '@/app/admin/(protected)/blog/taxonomies/actions';

const input = 'mt-2 w-full rounded-xl border border-foreground/10 bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-foreground/30 focus:ring-2 focus:ring-foreground/5';

type Item = {
    id: string;
    name: string;
    slug: string;
    description: string;
    sortOrder: number;
    isActive: boolean;
    usageCount: number;
};

export function ProjectCategoriesPanel({ items }: { items: Item[] }) {
    return (
        <section className="mt-10 space-y-4">
            <div className="flex items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Projects</p><h3 className="mt-1 text-xl font-semibold">Project categories</h3></div><span className="rounded-full border border-foreground/10 px-3 py-1 text-xs text-muted-foreground">{items.length}</span></div>
            <details className="rounded-2xl border border-foreground/10 bg-foreground/[0.025] p-4 sm:p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden"><div><h4 className="font-semibold">Create project category</h4><p className="mt-1 text-xs text-muted-foreground">Add a reusable category for the projects archive and project forms.</p></div><span className="rounded-full border border-foreground/10 px-3 py-1 text-xs text-muted-foreground">New</span></summary>
                <form action={createProjectCategory} className="mt-5 grid gap-4 border-t border-foreground/10 pt-5 md:grid-cols-2">
                    <label className="text-sm text-muted-foreground">Name<input name="name" required placeholder="Web development" className={input} /></label>
                    <label className="text-sm text-muted-foreground">Slug<input name="slug" required placeholder="web-development" className={input} /></label>
                    <label className="text-sm text-muted-foreground">Order<input name="sortOrder" type="number" defaultValue={100} className={input} /></label>
                    <label className="flex items-end gap-2 pb-3 text-sm text-muted-foreground"><input name="isActive" type="checkbox" defaultChecked /> Active</label>
                    <label className="text-sm text-muted-foreground md:col-span-2">Description<textarea name="description" rows={2} className={input} /></label>
                    <button className="rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background md:col-span-2">Create project category</button>
                </form>
            </details>
            <div className="space-y-3">
                {items.map((category) => (
                    <details key={category.id} className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4 sm:p-5">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold">{category.name}</h4><span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider ${category.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-foreground/5 text-muted-foreground'}`}>{category.isActive ? 'Active' : 'Hidden'}</span></div><p className="mt-1 text-xs text-muted-foreground">{category.usageCount} project(s) · /{category.slug}</p></div>
                            <span className="shrink-0 rounded-full border border-foreground/10 px-3 py-1 text-xs text-muted-foreground">Edit</span>
                        </summary>
                        <form action={updateProjectCategory.bind(null, category.id)} className="mt-5 grid gap-3 border-t border-foreground/10 pt-5 md:grid-cols-2">
                            <label className="text-xs text-muted-foreground">Name<input name="name" defaultValue={category.name} required className={input} /></label>
                            <label className="text-xs text-muted-foreground">Slug<input name="slug" defaultValue={category.slug} required className={input} /></label>
                            <label className="text-xs text-muted-foreground">Order<input name="sortOrder" type="number" defaultValue={category.sortOrder} className={input} /></label>
                            <label className="flex items-end gap-2 pb-3 text-xs text-muted-foreground"><input name="isActive" type="checkbox" defaultChecked={category.isActive} /> Active</label>
                            <label className="text-xs text-muted-foreground md:col-span-2">Description<textarea name="description" rows={2} defaultValue={category.description} className={input} /></label>
                            <button className="rounded-xl border border-foreground/15 px-4 py-2 text-sm font-medium md:col-span-2">Save project category</button>
                        </form>
                        <form action={deleteProjectCategory.bind(null, category.id)} className="mt-3 border-t border-foreground/10 pt-3"><button className="text-xs text-red-500/80 hover:text-red-500">Delete project category</button></form>
                    </details>
                ))}
            </div>
        </section>
    );
}
