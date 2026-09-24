'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';
import { type ServiceTool } from '@addons/Tools/settings';
import { IconPicker } from '@/components/admin/IconPicker';

const groups = [
    { name: 'Web & security', ids: ['website-inspector', 'accessibility', 'seo-intelligence', 'broken-links', 'email-security', 'whois', 'discord-lookup', 'url-scam-check'] },
    { name: 'Files & media', ids: ['document-converter', 'image-converter', 'social-video', 'pdf-file-check', 'merge-pdf', 'split-pdf', 'organize-pdf', 'compress-pdf', 'images-to-pdf', 'pdf-to-images', 'sign-pdf', 'watermark-pdf', 'document-inspector', 'exif-tool', 'compare-documents', 'binary-converter', 'base64-codec', 'file-hash', 'hex-viewer'] },
    { name: 'Everyday utilities', ids: ['text-toolkit', 'image-toolkit', 'calculator-toolkit', 'unit-converter', 'web-encoder', 'json-toolkit', 'url-toolkit', 'uuid-generator', 'password-generator', 'color-converter', 'subtitle-converter'] },
    { name: 'Engineering', ids: ['dxf-inspector', 'gcode-viewer', 'dxf-to-gcode', 'svg-to-gcode', 'gerber-to-gcode', 'gcode-editor'] },
];
const category = (id: string) => groups.find((group) => group.ids.includes(id))?.name || 'Other';
const field = 'mt-1.5 min-h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500';

export function ServiceToolsEditor({ initialTools, action }: { initialTools: ServiceTool[]; action: (form: FormData) => void | Promise<void> }) {
    const [tools, setTools] = useState(initialTools);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'hidden' | 'planned'>('all');
    const shown = useMemo(() => tools.filter((tool) => (!query || `${tool.name} ${tool.id}`.toLowerCase().includes(query.toLowerCase())) && (filter === 'all' || filter === 'active' && tool.enabled && !tool.comingSoon || filter === 'hidden' && !tool.visible || filter === 'planned' && tool.comingSoon)), [tools, query, filter]);
    const patch = (id: string, value: Partial<ServiceTool>) => setTools((current) => current.map((item) => item.id === id ? { ...item, ...value } : item));
    const move = (id: string, direction: -1 | 1) => setTools((current) => {
        const index = current.findIndex((item) => item.id === id);
        const target = index + direction;
        if (target < 0 || target >= current.length) return current;
        const next = [...current];
        [next[index], next[target]] = [next[target]!, next[index]!];
        return next;
    });
    return <form action={action} className="mt-6">
        <input type="hidden" name="tools" value={JSON.stringify(tools)} />
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background p-3"><label className="flex min-h-10 min-w-52 flex-1 items-center gap-2 px-2"><Search className="size-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a tool" className="w-full bg-transparent text-sm outline-none" /></label><select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="min-h-10 rounded-lg border border-border bg-background px-3 text-sm"><option value="all">All ({tools.length})</option><option value="active">Active</option><option value="hidden">Hidden</option><option value="planned">Planned</option></select></div>
        <div className="mt-5 space-y-3">{shown.map((tool) => { const index = tools.findIndex((item) => item.id === tool.id); return <details key={tool.id} className="group rounded-xl border border-border bg-background open:border-cyan-500/50"><summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4 marker:hidden"><span className="min-w-0 flex-1"><span className="block font-semibold">{tool.name}</span><span className="mt-1 block text-xs text-muted-foreground">{category(tool.id)} · {tool.href}</span></span><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tool.comingSoon ? 'bg-amber-500/10 text-amber-500' : tool.enabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>{tool.comingSoon ? 'Planned' : tool.enabled ? 'Active' : 'Inactive'}</span><span className="text-xs text-muted-foreground group-open:rotate-180">⌄</span></summary><div className="border-t border-border p-4"><div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]"><label className="text-xs text-muted-foreground">Display name<input value={tool.name} maxLength={80} onChange={(event) => patch(tool.id, { name: event.target.value })} className={field} /></label><label className="text-xs text-muted-foreground">Icon<IconPicker value={tool.icon} onChange={(icon) => patch(tool.id, { icon })} /></label><div className="text-xs text-muted-foreground">Order<div className="mt-1.5 flex gap-1"><button type="button" onClick={() => move(tool.id, -1)} disabled={index === 0} aria-label={`Move ${tool.name} up`} className="grid size-10 place-items-center rounded-lg border border-border disabled:opacity-30"><ArrowUp className="size-4" /></button><button type="button" onClick={() => move(tool.id, 1)} disabled={index === tools.length - 1} aria-label={`Move ${tool.name} down`} className="grid size-10 place-items-center rounded-lg border border-border disabled:opacity-30"><ArrowDown className="size-4" /></button></div></div></div><div className="mt-5 flex flex-wrap gap-5 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={tool.visible} onChange={(event) => patch(tool.id, { visible: event.target.checked })} className="size-4 accent-cyan-500" /> Show in catalogue</label><label className="flex items-center gap-2"><input type="checkbox" disabled={tool.comingSoon} checked={tool.enabled && !tool.comingSoon} onChange={(event) => patch(tool.id, { enabled: event.target.checked })} className="size-4 accent-cyan-500" /> Enable tool</label></div>{tool.comingSoon && <p className="mt-3 text-xs text-muted-foreground">This tool is planned and has no working route in this build.</p>}</div></details>; })}{shown.length === 0 && <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No tools match your filters.</p>}</div>
        <div className="sticky bottom-4 z-10 mt-6 flex items-center justify-between gap-3 rounded-xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur"><span className="text-xs text-muted-foreground">{tools.filter((tool) => tool.enabled && !tool.comingSoon).length} enabled</span><button type="submit" className="min-h-11 rounded-lg bg-foreground px-5 text-sm font-bold text-background">Save tool settings</button></div>
    </form>;
}
