'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { SUPPORTED_ICON_COUNT, SUPPORTED_ICON_NAMES } from '@/lib/icon-library';
import { SupportedIcon } from '@/components/ui/SupportedIcon';

const PAGE_SIZE = 96;

export function IconPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const matches = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        return (normalized ? SUPPORTED_ICON_NAMES.filter((name) => name.includes(normalized)) : SUPPORTED_ICON_NAMES).slice(0, PAGE_SIZE);
    }, [query]);

    return (
        <div className="relative">
            <button type="button" onClick={() => setOpen((current) => !current)} className="mt-1.5 flex min-h-11 w-full items-center gap-3 rounded-lg border border-foreground/15 bg-background px-3 py-2 text-left text-sm outline-none focus:ring-2 focus:ring-cyan-500">
                <SupportedIcon name={value} className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate font-mono text-xs">{value}</span>
                <span className="text-[10px] text-muted-foreground">{SUPPORTED_ICON_COUNT}</span>
            </button>
            {open ? (
                <div className="absolute right-0 z-40 mt-2 w-[min(92vw,430px)] rounded-xl border border-foreground/15 bg-background p-3 shadow-2xl">
                    <div className="flex items-center gap-2 border-b border-foreground/10 pb-3">
                        <Search className="size-4 text-muted-foreground" />
                        <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search icons..." className="min-h-9 min-w-0 flex-1 bg-transparent text-sm outline-none" />
                        <button type="button" onClick={() => setOpen(false)} aria-label="Close icon library" className="grid size-8 place-items-center rounded-md hover:bg-foreground/[0.06]"><X className="size-4" /></button>
                    </div>
                    <p className="py-2 text-[10px] text-muted-foreground">Showing {matches.length} of {query ? SUPPORTED_ICON_NAMES.filter((name) => name.includes(query.trim().toLowerCase())).length : SUPPORTED_ICON_COUNT} supported Lucide icons</p>
                    <div className="grid max-h-72 grid-cols-6 gap-1 overflow-y-auto pr-1 sm:grid-cols-8">
                        {matches.map((name) => <button key={name} type="button" title={name} onClick={() => { onChange(name); setOpen(false); setQuery(''); }} className={`grid aspect-square place-items-center rounded-lg border transition ${name === value ? 'border-cyan-500 bg-cyan-500/10 text-cyan-500' : 'border-transparent text-muted-foreground hover:border-foreground/15 hover:text-foreground'}`}><SupportedIcon name={name} className="size-4" /></button>)}
                    </div>
                    {matches.length === 0 ? <p className="py-8 text-center text-xs text-muted-foreground">No matching icons.</p> : null}
                </div>
            ) : null}
        </div>
    );
}
