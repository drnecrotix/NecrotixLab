'use client';

import { Children, type ReactNode, useState } from 'react';
import { BookOpen, Boxes, Cloud, Cpu, FolderKanban, LayoutTemplate } from 'lucide-react';

const tabs = [
    { id: 'hero', label: 'Hero & profile', hint: 'Opening experience', icon: LayoutTemplate },
    { id: 'ideas', label: 'Ideas', hint: 'Capability grid', icon: Boxes },
    { id: 'journal', label: 'Journal', hint: 'Dynamic posts', icon: BookOpen },
    { id: 'engineering', label: 'Engineering', hint: 'CNC lab', icon: Cpu },
    { id: 'projects', label: 'Case studies', hint: 'Selected work', icon: FolderKanban },
    { id: 'cloud', label: 'Cloud', hint: 'Kreatrics workspace', icon: Cloud },
] as const;

export function HomepageAdminTabs({ children }: { children: ReactNode }) {
    const [active, setActive] = useState<(typeof tabs)[number]['id']>('hero');
    const panels = Children.toArray(children);
    return (
        <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
            <div role="tablist" aria-label="Homepage sections" className="h-fit rounded-2xl border border-white/10 bg-white/[0.025] p-2 lg:sticky lg:top-24">
                {tabs.map(({ id, label, hint, icon: Icon }, index) => {
                    const selected = active === id;
                    return <button key={id} type="button" role="tab" aria-selected={selected} aria-controls={`homepage-panel-${id}`} onClick={() => setActive(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${selected ? 'bg-white text-black' : 'text-white/45 hover:bg-white/[0.05] hover:text-white/80'}`}><Icon className="size-4 shrink-0" /><span><strong className="block text-xs font-semibold">{label}</strong><span className={`mt-0.5 block text-[10px] ${selected ? 'text-black/55' : 'text-white/25'}`}>{hint}</span></span></button>;
                })}
            </div>
            <div>
                {tabs.map((tab, index) => <div key={tab.id} id={`homepage-panel-${tab.id}`} role="tabpanel" hidden={active !== tab.id}>{panels[index]}</div>)}
            </div>
        </div>
    );
}
