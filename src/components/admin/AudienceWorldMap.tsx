'use client';

import { useState } from 'react';
import geography from '@/data/world-countries.json';

type AudienceCountry = { code: string; name: string; pageViews: number; visits: number };

export function AudienceWorldMap({ countries, selectedCode, onSelect }: { countries: AudienceCountry[]; selectedCode?: string | null; onSelect?: (code: string) => void }) {
    const [hovered, setHovered] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const values = new Map(countries.map((country) => [country.code, country]));
    const max = Math.max(1, ...countries.map((country) => country.visits));
    const selected = hovered || selectedCode;
    const geo = geography.find((country) => country.code === selected);
    const value = selected ? values.get(selected) : undefined;
    return <div className="overflow-hidden rounded-xl border border-foreground/10 bg-sky-500/[0.025]">
        <div className="flex items-center justify-between gap-2 border-b border-foreground/10 px-3 py-2"><p aria-live="polite" className="text-xs"><strong>{geo?.name || 'World overview'}</strong><span className="text-muted-foreground">{geo ? ` · ${value?.visits || 0} visits · ${value?.pageViews || 0} page views` : ' · Select a country'}</span></p><div className="flex gap-1"><button type="button" aria-label="Zoom out map" disabled={zoom <= 1} onClick={() => setZoom(1)} className="h-8 w-8 rounded border border-foreground/10 disabled:opacity-30">−</button><button type="button" aria-label="Zoom in map" disabled={zoom >= 2} onClick={() => setZoom(2)} className="h-8 w-8 rounded border border-foreground/10 disabled:opacity-30">+</button></div></div>
        <div className="overflow-auto"><svg viewBox="0 0 960 480" role="group" aria-label="World map of visits by country" className="block max-w-none" style={{ width: `${zoom * 100}%`, minWidth: 480 }}>
            {geography.map((country) => {
                const count = values.get(country.code)?.visits || 0;
                const active = selected === country.code;
                return <path key={`${country.code}-${country.name}`} d={country.path} role="button" tabIndex={0} aria-label={`${country.name}: ${count} visits`} aria-pressed={selectedCode === country.code} onMouseEnter={() => setHovered(country.code)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(country.code)} onBlur={() => setHovered(null)} onClick={() => onSelect?.(country.code)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect?.(country.code); } }} fill={active ? '#38bdf8' : count ? `rgba(16,185,129,${0.25 + 0.65 * Math.sqrt(count / max)})` : 'currentColor'} className="cursor-pointer text-foreground/10 outline-none transition-colors focus:stroke-sky-400" stroke={active ? '#0284c7' : '#64748b'} strokeWidth={active ? 1.5 : 0.55} vectorEffect="non-scaling-stroke"><title>{`${country.name}: ${count} visits`}</title></path>;
            })}
        </svg></div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-foreground/10 px-3 py-2 text-[10px] text-muted-foreground"><span>Equal Earth · country boundaries · approximate attribution</span><span className="inline-flex items-center gap-2">No recorded visits <span className="h-2 w-20 rounded bg-gradient-to-r from-emerald-500/20 to-emerald-500" /> {max} visits</span></div>
    </div>;
}
