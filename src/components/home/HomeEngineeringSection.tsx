'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Pause, Play } from 'lucide-react';
import type { HomepageContent } from '@/lib/homepage-content';

const program = [
    'N010 G21 G90 G54',
    'N020 T01 M06',
    'N030 S2400 M03',
    'N040 G00 X18.0 Y14.0',
    'N050 G01 Z-3.0 F180',
    'N060 G02 X72.0 Y46.0 R28.0',
    'N070 G01 X108.0 Y46.0 F320',
];

export function HomeEngineeringSection({ content }: { content: HomepageContent }) {
    const reduceMotion = useReducedMotion();
    const [running, setRunning] = useState(true);
    const animatePath = running && !reduceMotion;
    const services = content.engineeringServices.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 8);

    return (
        <section id="engineering-cnc" aria-labelledby="engineering-title" className="relative overflow-hidden border-t border-foreground/10 bg-zinc-950 px-6 py-16 text-zinc-100 md:px-16 md:py-20 lg:px-24 lg:py-24">
            <div aria-hidden="true" className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] [background-size:32px_32px]" />
            <div className="relative mx-auto grid w-full min-w-0 max-w-[1400px] gap-12 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)] lg:items-center lg:gap-20">
                <div className="min-w-0">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.26em] text-amber-400">{content.engineeringEyebrow}</p>
                    <h2 id="engineering-title" className="mt-5 max-w-[11ch] text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-6xl">{content.engineeringTitle}</h2>
                    <p className="mt-6 max-w-xl text-base leading-7 text-zinc-400">{content.engineeringDescription}</p>
                    <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-white/10 py-5 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-400 sm:text-[10px]">
                        {services.map((service) => <span key={service}>{service}</span>)}
                    </div>
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <Link href={content.engineeringButtonUrl} className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-zinc-100 px-5 text-sm font-semibold text-zinc-950 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 motion-reduce:transform-none">{content.engineeringButtonLabel} <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
                        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-400/80">{content.engineeringStatus}</span>
                    </div>
                </div>

                <motion.div initial={reduceMotion ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: reduceMotion ? 0 : 0.55 }} className="w-full min-w-0 overflow-hidden border border-white/15 bg-black/55 backdrop-blur">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
                        <div className="flex items-center gap-3"><span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.8)]" /><span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400">NL-CNC / Toolpath preview</span></div>
                        <button type="button" onClick={() => setRunning((value) => !value)} className="grid size-9 place-items-center border border-white/10 text-zinc-300 transition hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400" aria-label={running ? 'Pause toolpath simulation' : 'Play toolpath simulation'}>{running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}</button>
                    </div>

                    <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_230px]">
                        <div className="relative aspect-[5/4] min-h-0 min-w-0 overflow-hidden border-b border-white/10 sm:aspect-[4/3] lg:border-b-0 lg:border-r">
                            <svg viewBox="0 0 620 460" preserveAspectRatio="xMidYMid meet" className="block h-full w-full max-w-full" role="img" aria-label="Animated CNC toolpath around a mechanical plate">
                                <defs><pattern id="cnc-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(255,255,255,.055)" strokeWidth="1" /></pattern></defs>
                                <rect width="620" height="460" fill="url(#cnc-grid)" />
                                <g fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="2">
                                    <path d="M122 112H446L504 170V324L456 370H150L96 316V166Z" />
                                    <rect x="164" y="168" width="268" height="146" rx="20" />
                                    <circle cx="150" cy="164" r="15" /><circle cx="450" cy="164" r="15" /><circle cx="150" cy="320" r="15" /><circle cx="450" cy="320" r="15" />
                                    <circle cx="298" cy="241" r="48" /><path d="M250 241H346M298 193V289" stroke="rgba(255,255,255,.12)" strokeWidth="1" />
                                </g>
                                <motion.path d="M78 138L122 112H446L504 170V324L456 370H150L96 316V166L122 112M164 168H412Q432 168 432 188V294Q432 314 412 314H184Q164 314 164 294V188Q164 168 184 168M346 241A48 48 0 1 1 250 241A48 48 0 1 1 346 241" fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" strokeDasharray="9 8" initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: animatePath ? -170 : 0 }} transition={animatePath ? { duration: 8, ease: 'linear', repeat: Infinity } : { duration: 0 }} />
                                <motion.circle r="16" fill="none" stroke="rgba(251,191,36,.35)" animate={animatePath ? { cx: [78, 122, 446, 504, 504, 456, 150, 96, 96, 122], cy: [138, 112, 112, 170, 324, 370, 370, 316, 166, 112] } : { cx: 446, cy: 112 }} transition={animatePath ? { duration: 8, ease: 'linear', repeat: Infinity, times: [0, .07, .31, .4, .58, .66, .84, .91, .97, 1] } : { duration: 0 }} />
                                <motion.circle r="7" fill="#fbbf24" animate={animatePath ? { cx: [78, 122, 446, 504, 504, 456, 150, 96, 96, 122], cy: [138, 112, 112, 170, 324, 370, 370, 316, 166, 112] } : { cx: 446, cy: 112 }} transition={animatePath ? { duration: 8, ease: 'linear', repeat: Infinity, times: [0, .07, .31, .4, .58, .66, .84, .91, .97, 1] } : { duration: 0 }} />
                                <g className="font-mono" fontSize="10" fill="rgba(255,255,255,.4)"><text x="26" y="434">X 108.000</text><text x="122" y="434">Y 046.000</text><text x="218" y="434">Z -03.000</text><text x="520" y="434">MM</text></g>
                            </svg>
                            <div className="absolute left-4 top-4 border border-white/10 bg-black/55 px-3 py-2 font-mono text-[9px] uppercase leading-5 tracking-[0.14em] text-zinc-400"><span className="text-zinc-100">Work offset</span><br />G54 / XY plane</div>
                        </div>
                        <div className="flex flex-col bg-zinc-950/80">
                            <div className="grid grid-cols-3 border-b border-white/10">
                                {[['X', '108.000'], ['Y', '046.000'], ['Z', '-03.000']].map(([axis, value]) => <div key={axis} className="border-r border-white/10 px-3 py-4 last:border-r-0"><span className="block font-mono text-[9px] text-amber-400">{axis}</span><strong className="mt-1 block font-mono text-[11px] font-medium text-zinc-200">{value}</strong></div>)}
                            </div>
                            <div className="flex-1 px-4 py-5 font-mono text-[10px] leading-7 text-zinc-500">
                                {program.map((line, index) => <p key={line} className={index === 5 ? 'bg-amber-400/10 px-2 text-amber-300' : 'px-2'}>{line}</p>)}
                            </div>
                            <div className="grid grid-cols-2 border-t border-white/10 px-4 py-4 font-mono text-[9px] uppercase leading-5 tracking-[0.12em] text-zinc-500"><span>Tool<br /><b className="text-zinc-300">T01 / Ø10</b></span><span>Feed<br /><b className="text-zinc-300">320 mm/min</b></span></div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
