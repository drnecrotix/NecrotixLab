'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { SupportedIcon } from '@/components/ui/SupportedIcon';
import { type ServiceTool } from '@addons/Tools/settings';

const groups = [
    { name: 'All tools', ids: [] },
    { name: 'Web & security', ids: ['website-inspector', 'accessibility', 'seo-intelligence', 'broken-links', 'email-security', 'whois', 'discord-lookup', 'url-scam-check'] },
    { name: 'Files & media', ids: ['document-converter', 'image-converter', 'social-video', 'pdf-file-check', 'merge-pdf', 'split-pdf', 'organize-pdf', 'compress-pdf', 'images-to-pdf', 'pdf-to-images', 'sign-pdf', 'watermark-pdf', 'document-inspector', 'exif-tool', 'compare-documents', 'binary-converter', 'base64-codec', 'file-hash', 'hex-viewer'] },
    { name: 'Everyday', ids: ['text-toolkit', 'image-toolkit', 'calculator-toolkit', 'unit-converter', 'web-encoder', 'json-toolkit', 'url-toolkit', 'uuid-generator', 'password-generator', 'color-converter', 'subtitle-converter'] },
    { name: 'Engineering', ids: ['dxf-inspector', 'gcode-viewer', 'dxf-to-gcode', 'svg-to-gcode', 'gerber-to-gcode', 'gcode-editor'] },
];
const groupOf = (id: string) => groups.slice(1).find((group) => group.ids.includes(id))?.name || 'Utilities';

export function ToolsCatalog({ tools }: { tools: ServiceTool[] }) {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('All tools');
    const [showPlanned, setShowPlanned] = useState(false);
    const available = tools.filter((tool) => tool.enabled && !tool.comingSoon && tool.href);
    const planned = tools.filter((tool) => tool.comingSoon);
    const matches = useMemo(() => (showPlanned ? [...available, ...planned] : available).filter((tool) => (category === 'All tools' || groupOf(tool.id) === category) && (!query || `${tool.name} ${tool.id} ${groupOf(tool.id)}`.toLowerCase().includes(query.trim().toLowerCase()))), [available, planned, showPlanned, category, query]);

    return <section aria-label="Tools catalogue" className="mt-8">
        <div className="flex items-center gap-3 border-b border-border/80 pb-3">
            <Search className="size-5 shrink-0 text-cyan-500" aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools by name or category" aria-label="Search tools" className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-cyan-500" />
            <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:block">{matches.length} results</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-b border-border/80" aria-label="Tool categories">
            {groups.map((group) => {
                const count = available.filter((tool) => group.name === 'All tools' || groupOf(tool.id) === group.name).length;
                return <button key={group.name} type="button" onClick={() => setCategory(group.name)} aria-pressed={category === group.name} className={`min-h-11 border-b-2 px-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${category === group.name ? 'border-cyan-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{group.name} <span className="ml-1 opacity-60">{count}</span></button>;
            })}
        </div>
        <div className="mt-8 grid grid-cols-3 border-l border-t border-border/70 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
            {matches.map((tool) => {
                const active = tool.enabled && !tool.comingSoon && Boolean(tool.href);
                const content = <><span className="relative"><SupportedIcon name={tool.icon} className={`size-6 transition-transform ${active ? 'text-cyan-500 group-hover:-translate-y-1' : 'text-muted-foreground/55'}`} strokeWidth={1.5} />{tool.comingSoon && <span className="absolute -right-2 -top-2 size-1.5 rounded-full bg-amber-500" aria-label="Coming soon" />}</span><span className={`mt-3 text-center text-[11px] font-semibold leading-4 ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{tool.name}</span></>;
                const className = 'group flex aspect-square min-h-24 flex-col items-center justify-center border-b border-r border-border/70 px-2 py-3 transition-colors';
                return active ? <Link key={tool.id} href={tool.href} className={`${className} hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500`}>{content}</Link> : <div key={tool.id} className={`${className} cursor-default bg-foreground/[0.015]`} title={tool.comingSoon ? 'Coming soon' : 'Temporarily unavailable'}>{content}</div>;
            })}
        </div>
        {matches.length === 0 && <div className="border-b border-r border-border/70 px-5 py-10 text-center"><p className="font-semibold">No matching tools</p><p className="mt-2 text-sm text-muted-foreground">Try another term or category.</p><button type="button" onClick={() => { setQuery(''); setCategory('All tools'); }} className="mt-4 text-sm font-semibold text-cyan-500 underline">Clear filters</button></div>}
        <div className="mt-5 flex items-center justify-between gap-4 text-xs text-muted-foreground"><p>{available.length} ready to use{planned.length ? ` · ${planned.length} in preparation` : ''}</p>{planned.length > 0 && <button type="button" onClick={() => setShowPlanned((value) => !value)} aria-pressed={showPlanned} className="font-semibold text-cyan-500 hover:underline">{showPlanned ? 'Hide planned' : 'Show planned tools'}</button>}</div>
    </section>;
}
