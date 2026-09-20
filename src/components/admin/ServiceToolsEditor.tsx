'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { SERVICE_TOOL_ICONS, type ServiceTool } from '@/modules/service-tools/settings';

const field = 'min-h-11 w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500';

export function ServiceToolsEditor({ initialTools, action }: { initialTools: ServiceTool[]; action: (form: FormData) => void | Promise<void> }) {
    const [tools, setTools] = useState(initialTools);
    const move = (index: number, direction: -1 | 1) => setTools((current) => {
        const target = index + direction;
        if (target < 0 || target >= current.length) return current;
        const next = [...current];
        [next[index], next[target]] = [next[target]!, next[index]!];
        return next;
    });
    const patch = (index: number, value: Partial<ServiceTool>) => setTools((current) => current.map((tool, itemIndex) => itemIndex === index ? { ...tool, ...value } : tool));
    const add = () => setTools((current) => [...current, { id: `tool-${Date.now()}`, name: 'New tool', href: '/tools/new-tool', icon: 'wrench', enabled: false, visible: true, comingSoon: true }]);

    return (
        <form action={action} className="mt-8">
            <input type="hidden" name="tools" value={JSON.stringify(tools)} />
            <div className="space-y-4">
                {tools.map((tool, index) => (
                    <article key={tool.id} className="rounded-xl border border-foreground/15 bg-foreground/[0.02] p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Module {String(index + 1).padStart(2, '0')}</p><h2 className="mt-1 font-semibold">{tool.name}</h2></div>
                            <div className="flex gap-1"><button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move tool up" className="grid size-10 place-items-center rounded-lg border border-foreground/15 disabled:opacity-30"><ArrowUp className="size-4" /></button><button type="button" onClick={() => move(index, 1)} disabled={index === tools.length - 1} aria-label="Move tool down" className="grid size-10 place-items-center rounded-lg border border-foreground/15 disabled:opacity-30"><ArrowDown className="size-4" /></button><button type="button" onClick={() => setTools((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label="Delete tool" className="grid size-10 place-items-center rounded-lg border border-rose-500/25 text-rose-500"><Trash2 className="size-4" /></button></div>
                        </div>
                        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1.2fr_.8fr]">
                            <label className="text-xs text-muted-foreground">Name<input value={tool.name} onChange={(event) => patch(index, { name: event.target.value })} className={`${field} mt-1.5 text-foreground`} /></label>
                            <label className="text-xs text-muted-foreground">Internal URL<input value={tool.href} onChange={(event) => patch(index, { href: event.target.value })} placeholder="/tools/example" className={`${field} mt-1.5 font-mono text-foreground`} /></label>
                            <label className="text-xs text-muted-foreground">Icon<select value={tool.icon} onChange={(event) => patch(index, { icon: event.target.value as ServiceTool['icon'] })} className={`${field} mt-1.5 text-foreground`}>{SERVICE_TOOL_ICONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}</select></label>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm">
                            <label className="flex items-center gap-2"><input type="checkbox" checked={tool.visible} onChange={(event) => patch(index, { visible: event.target.checked })} className="size-4 accent-cyan-500" /> Visible</label>
                            <label className="flex items-center gap-2"><input type="checkbox" checked={tool.enabled} onChange={(event) => patch(index, { enabled: event.target.checked })} className="size-4 accent-cyan-500" /> Active and clickable</label>
                            <label className="flex items-center gap-2"><input type="checkbox" checked={tool.comingSoon} onChange={(event) => patch(index, { comingSoon: event.target.checked })} className="size-4 accent-amber-500" /> Coming Soon</label>
                        </div>
                    </article>
                ))}
            </div>
            <div className="sticky bottom-0 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-foreground/15 bg-background/95 p-3 shadow-lg backdrop-blur sm:bottom-4">
                <button type="button" onClick={add} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-foreground/15 px-4 text-sm font-semibold"><Plus className="size-4" /> Add tool</button>
                <button type="submit" className="min-h-11 rounded-lg bg-foreground px-5 text-sm font-bold text-background">Save tool modules</button>
            </div>
        </form>
    );
}
