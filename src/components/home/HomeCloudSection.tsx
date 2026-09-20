'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const nodes = [
    { label: 'FILES', x: 92, y: 82 },
    { label: 'ACCESS', x: 508, y: 82 },
    { label: 'SHARE', x: 92, y: 318 },
    { label: 'SYNC', x: 508, y: 318 },
] as const;

export function HomeCloudSection() {
    const reduceMotion = useReducedMotion();
    const moving = !reduceMotion;

    return (
        <section aria-labelledby="cloud-title" className="border-t border-foreground/10 bg-[linear-gradient(180deg,hsl(var(--foreground)/0.025),transparent_70%)] px-6 py-16 md:px-16 md:py-20 lg:px-24 lg:py-24">
            <div className="mx-auto grid w-full min-w-0 max-w-[1400px] gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-20">
                <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-500">Kreatrics / Private cloud</p>
                    <h2 id="cloud-title" className="mt-5 max-w-[11ch] text-4xl font-semibold leading-[0.96] tracking-[-0.055em] sm:text-5xl lg:text-6xl">One space for work that needs to stay connected.</h2>
                    <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">cloud.kreatrics.com is the cloud access point for Kreatrics - a dedicated workspace for files, shared material and the services that will connect the wider platform.</p>
                    <div className="mt-7 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{['Browser access', 'Organized files', 'Controlled sharing', 'Growing platform'].map((item) => <span key={item} className="border border-foreground/10 px-3 py-2">{item}</span>)}</div>
                    <a href="https://cloud.kreatrics.com" target="_blank" rel="noreferrer" className="group mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-4 focus-visible:ring-offset-background">Open Kreatrics Cloud <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a>
                </div>

                <div className="min-w-0 overflow-hidden border border-foreground/10 bg-background/80 shadow-[0_30px_100px_-60px_rgba(14,165,233,.55)]">
                    <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,.7)]" /> Cloud workspace</span><span>cloud.kreatrics.com</span></div>
                    <div className="relative aspect-[5/4] min-h-0 w-full sm:aspect-[3/2]">
                        <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid meet" className="block h-full w-full" role="img" aria-label="Animated diagram connecting files, access, sharing and synchronization to Kreatrics Cloud">
                            <defs><pattern id="cloud-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="currentColor" strokeOpacity=".055" /></pattern><radialGradient id="cloud-core"><stop offset="0" stopColor="#38bdf8" stopOpacity=".24" /><stop offset="1" stopColor="#38bdf8" stopOpacity="0" /></radialGradient></defs>
                            <rect width="600" height="400" fill="url(#cloud-grid)" />
                            <circle cx="300" cy="200" r="118" fill="url(#cloud-core)" />
                            {nodes.map((node) => <path key={node.label} d={`M${node.x} ${node.y} L300 200`} stroke="currentColor" strokeOpacity=".16" strokeDasharray="4 7" />)}
                            <motion.circle r="4" fill="#38bdf8" animate={moving ? { cx: [92, 300, 508, 300, 92], cy: [82, 200, 318, 200, 82], opacity: [0, 1, 1, 1, 0] } : { cx: 300, cy: 200, opacity: 1 }} transition={moving ? { duration: 7, repeat: Infinity, ease: 'linear' } : { duration: 0 }} />
                            <motion.circle cx="300" cy="200" r="60" fill="none" stroke="#38bdf8" strokeOpacity=".35" animate={moving ? { r: [52, 70, 52], opacity: [.25, .55, .25] } : { r: 60, opacity: .35 }} transition={moving ? { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }} />
                            <circle cx="300" cy="200" r="43" fill="hsl(var(--background))" stroke="currentColor" strokeOpacity=".18" />
                            <g transform="translate(278 178)" fill="none" stroke="#38bdf8" strokeWidth="2"><path d="M12 31h22a10 10 0 0 0 1-20 14 14 0 0 0-27-1 11 11 0 0 0 4 21Z" /></g>
                            <text x="300" y="260" textAnchor="middle" fill="currentColor" opacity=".52" fontSize="10" fontFamily="monospace" letterSpacing="2">KREATRICS CLOUD</text>
                            {nodes.map((node) => <g key={node.label}><circle cx={node.x} cy={node.y} r="28" fill="hsl(var(--background))" stroke="currentColor" strokeOpacity=".16" /><circle cx={node.x} cy={node.y} r="5" fill="#38bdf8" /><text x={node.x} y={node.y + 47} textAnchor="middle" fill="currentColor" opacity=".48" fontSize="9" fontFamily="monospace" letterSpacing="1.5">{node.label}</text></g>)}
                        </svg>
                    </div>
                    <div className="grid grid-cols-3 border-t border-foreground/10 font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[9px]">{[['Workspace', 'Connected'], ['Access', 'Browser'], ['Status', 'Online']].map(([label, value]) => <div key={label} className="border-r border-foreground/10 px-3 py-4 last:border-r-0 sm:px-5"><span>{label}</span><strong className="mt-1 block font-medium text-foreground">{value}</strong></div>)}</div>
                </div>
            </div>
        </section>
    );
}
