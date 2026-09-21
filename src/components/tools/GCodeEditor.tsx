'use client';

import { useMemo, useState } from 'react';
import { Download, Play, Plus, RotateCcw } from 'lucide-react';
import { analyzeGCode } from '@/modules/gcode/parser';

const starter = `(NecrotixLab starter program)
G21 G90 G17
G0 Z5
G0 X0 Y0
M3 S12000
G1 Z-1 F120
G1 X40 Y0 F500
G1 X40 Y30
G1 X0 Y30
G1 X0 Y0
G0 Z5
M5
M30`;

const snippets = [
    ['Rapid move', 'G0 X0 Y0 Z5'], ['Linear cut', 'G1 X20 Y10 F400'], ['Clockwise arc', 'G2 X20 Y20 I0 J5'],
    ['Metric / absolute', 'G21 G90'], ['Spindle on', 'M3 S12000'], ['Spindle off', 'M5'], ['Program end', 'M30'],
] as const;

export function GCodeEditor() {
    const [code, setCode] = useState(starter);
    const [selected, setSelected] = useState('Linear cut');
    const analysis = useMemo(() => analyzeGCode(code), [code]);
    const width = Math.max(analysis.bounds.maxX - analysis.bounds.minX, 1);
    const height = Math.max(analysis.bounds.maxY - analysis.bounds.minY, 1);
    const path = analysis.points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${-point.y}`).join(' ');
    const rapidPaths = analysis.points.slice(1).map((point, index) => point.rapid ? `M ${analysis.points[index]!.x} ${-analysis.points[index]!.y} L ${point.x} ${-point.y}` : '').filter(Boolean);

    const insertSnippet = () => {
        const snippet = snippets.find(([name]) => name === selected)?.[1] ?? '';
        setCode((value) => `${value.replace(/\s+$/, '')}\n${snippet}`);
    };
    const download = () => {
        const url = URL.createObjectURL(new Blob([code], { type: 'text/plain;charset=utf-8' }));
        const link = document.createElement('a'); link.href = url; link.download = 'necrotixlab-program.nc'; link.click(); URL.revokeObjectURL(url);
    };

    return <div className="space-y-5">
        <section className="grid overflow-hidden rounded-2xl border border-border lg:grid-cols-[1.05fr_.95fr]">
            <div className="border-b border-border lg:border-b-0 lg:border-r">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                    <div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-cyan-500">Editable program</p><p className="mt-1 text-xs text-muted-foreground">ISO-style milling commands</p></div>
                    <div className="flex gap-2"><button type="button" onClick={() => setCode(starter)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs font-bold"><RotateCcw className="size-3.5" /> Reset</button><button type="button" onClick={download} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-foreground px-3 text-xs font-bold text-background"><Download className="size-3.5" /> Download .nc</button></div>
                </div>
                <div className="grid grid-cols-[3rem_1fr] bg-foreground/[.025]">
                    <pre aria-hidden="true" className="select-none border-r border-border px-3 py-4 text-right font-mono text-xs leading-6 text-muted-foreground/55">{code.split(/\r?\n/).map((_, index) => index + 1).join('\n')}</pre>
                    <textarea aria-label="G-Code program" value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} className="min-h-[30rem] w-full resize-y bg-transparent p-4 font-mono text-xs leading-6 text-foreground outline-none focus:bg-cyan-500/[.025]" />
                </div>
            </div>
            <div className="flex min-h-[32rem] flex-col bg-[linear-gradient(rgba(127,127,127,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(127,127,127,.07)_1px,transparent_1px)] bg-[size:24px_24px] p-5">
                <div className="flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-emerald-500">Toolpath preview</p><p className="mt-1 text-xs text-muted-foreground">XY plane - rapid moves are dashed</p></div><Play className="size-4 text-emerald-500" /></div>
                <div className="grid flex-1 place-items-center py-6">
                    <svg role="img" aria-label="G-Code toolpath preview" viewBox={`${analysis.bounds.minX - width * .1} ${-analysis.bounds.maxY - height * .1} ${width * 1.2} ${height * 1.2}`} className="max-h-[27rem] w-full overflow-visible" preserveAspectRatio="xMidYMid meet">
                        <path d={path} fill="none" stroke="currentColor" strokeWidth={Math.max(width, height) / 180} className="text-amber-400" vectorEffect="non-scaling-stroke" />
                        {rapidPaths.map((item, index) => <path key={index} d={item} fill="none" stroke="currentColor" strokeDasharray="5 5" strokeWidth="1" className="text-cyan-400" vectorEffect="non-scaling-stroke" />)}
                    </svg>
                </div>
                <div className="grid grid-cols-3 border border-border bg-background/80 text-center backdrop-blur"><Metric label="Moves" value={analysis.motionCount} /><Metric label="Distance" value={`${analysis.distance.toFixed(1)} mm`} /><Metric label="Issues" value={analysis.issues.length} /></div>
            </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-border p-5"><p className="font-mono text-[9px] uppercase tracking-[.18em] text-cyan-500">Code assistant</p><h2 className="mt-2 text-xl font-black">Insert a safe starting command</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Choose a common block, review its coordinates and feed or spindle value, then insert it at the end of the editable program.</p><div className="mt-5 flex flex-col gap-2 sm:flex-row"><select aria-label="G-Code helper command" value={selected} onChange={(event) => setSelected(event.target.value)} className="min-h-11 flex-1 rounded-xl border border-border bg-background px-3 font-mono text-xs text-foreground outline-none focus:ring-2 focus:ring-cyan-500">{snippets.map(([name, value]) => <option key={name} value={name}>{name} - {value}</option>)}</select><button type="button" onClick={insertSnippet} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-xs font-bold text-background"><Plus className="size-4" /> Insert</button></div><p className="mt-4 text-[11px] leading-5 text-amber-600 dark:text-amber-400">Always simulate and verify work offsets, units, clearances, feeds and machine limits before running code on CNC equipment.</p></div>
            <div className="rounded-2xl border border-border p-5"><div className="flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.18em] text-cyan-500">Program check</p><h2 className="mt-2 text-xl font-black">{analysis.issues.length ? `${analysis.issues.length} items to review` : 'No basic issues found'}</h2></div><span className={`size-2.5 rounded-full ${analysis.issues.some((issue) => issue.level === 'error') ? 'bg-rose-500' : analysis.issues.length ? 'bg-amber-400' : 'bg-emerald-500'}`} /></div><div className="mt-5 max-h-56 space-y-2 overflow-auto">{analysis.issues.length ? analysis.issues.map((issue, index) => <div key={`${issue.line}-${index}`} className="flex gap-3 rounded-xl bg-foreground/[.035] p-3 text-xs"><span className="font-mono text-muted-foreground">L{issue.line}</span><span className={issue.level === 'error' ? 'text-rose-500' : 'text-amber-600 dark:text-amber-400'}>{issue.message}</span></div>) : <p className="rounded-xl bg-emerald-500/10 p-4 text-xs text-emerald-600 dark:text-emerald-400">Syntax, feed values and program ending passed the basic browser check.</p>}</div></div>
        </section>
    </div>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return <div className="border-r border-border p-3 last:border-r-0"><span className="block font-mono text-[8px] uppercase tracking-wider text-muted-foreground">{label}</span><strong className="mt-1 block text-xs">{value}</strong></div>;
}
