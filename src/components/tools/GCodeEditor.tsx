'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { analyzeGCode } from '@/modules/gcode/parser';

const starter = `(NecrotixLab starter program)
G21 G90 G17 G94
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
    ['Metric safety block', 'G21 G90 G17 G94 G40 G49 G80'], ['Inch safety block', 'G20 G90 G17 G94 G40 G49 G80'],
    ['Work offset', 'G54'], ['Retract to safe Z', 'G0 Z5'], ['Rapid XY', 'G0 X0 Y0'], ['Cutting move', 'G1 X20 Y10 F400'],
    ['Clockwise arc', 'G2 X20 Y20 I0 J5'], ['Counterclockwise arc', 'G3 X20 Y20 I0 J5'], ['Spindle on', 'M3 S12000'], ['Spindle off', 'M5'], ['End program', 'M30'],
] as const;
function save(code: string, extension: string) { const url = URL.createObjectURL(new Blob([code], { type: 'text/plain;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = `necrotixlab-program.${extension}`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export function GCodeEditor() {
    const [code, setCode] = useState(starter), [selected, setSelected] = useState<string>(snippets[0][0]);
    const [step, setStep] = useState(0), [playing, setPlaying] = useState(false), [speed, setSpeed] = useState(500), [error, setError] = useState('');
    const fileInput = useRef<HTMLInputElement>(null), textarea = useRef<HTMLTextAreaElement>(null), gutter = useRef<HTMLDivElement>(null);
    const analysis = useMemo(() => analyzeGCode(code), [code]);
    const points = analysis.points, last = analysis.lineCount, currentIndex = Math.max(0, points.findLastIndex((point) => point.line <= step)), current = points[currentIndex]!;
    const width = Math.max(analysis.bounds.maxX - analysis.bounds.minX, 1), height = Math.max(analysis.bounds.maxY - analysis.bounds.minY, 1);
    useEffect(() => { if (!playing) return; if (step >= last) { setPlaying(false); return; } const timer = window.setTimeout(() => setStep((s) => Math.min(s + 1, last)), speed); return () => window.clearTimeout(timer); }, [playing, step, last, speed]);
    useEffect(() => { setPlaying(false); setStep(0); }, [code]);
    useEffect(() => { const line = step; if (line > 0 && playing && textarea.current) textarea.current.scrollTop = Math.max(0, (line - 5) * 24); }, [current.line, playing]);
    const segments = points.slice(1).map((point, i) => ({ from: points[i]!, to: point, index: i + 1 }));
    const append = () => { const snippet = snippets.find(([name]) => name === selected)?.[1]; if (snippet) setCode((value) => `${value.trimEnd()}\n${snippet}`); };
    const importFile = async (file?: File) => { if (!file) return; if (!/\.(nc|txt)$/i.test(file.name) || file.size > 1_000_000) { setError('Choose a .nc or .txt file up to 1 MB.'); return; } setError(''); setCode(await file.text()); };
    return <div className="space-y-5">
        <section className="grid min-w-0 max-w-full overflow-hidden rounded-2xl border border-border lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
            <div className="min-w-0 border-b border-border lg:border-b-0 lg:border-r"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4"><div><p className="font-mono text-xs text-cyan-500">G-code program</p><p className="text-xs text-muted-foreground">Line {step || 1} of {analysis.lineCount}</p></div><div className="flex flex-wrap gap-2"><input ref={fileInput} className="hidden" type="file" accept=".nc,.txt,text/plain" onChange={(e) => void importFile(e.target.files?.[0])} /><Button onClick={() => fileInput.current?.click()}>Import .nc/.txt</Button><Button onClick={() => setCode(starter)}>Reset</Button><Button onClick={() => save(code, 'nc')}>Export .nc</Button><Button onClick={() => save(code, 'txt')}>Export .txt</Button></div></div>
                <div className="grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] bg-foreground/[.025]"><div ref={gutter} aria-hidden="true" className="h-[32rem] overflow-hidden border-r border-border py-4 text-right font-mono text-xs leading-6 text-muted-foreground/60">{code.split(/\r?\n/).map((_, i) => <div key={i} className={`pr-3 ${step === i + 1 ? 'bg-cyan-500/25 font-bold text-cyan-500' : ''}`}>{i + 1}</div>)}</div><textarea ref={textarea} aria-label="G-Code program" value={code} onScroll={(e) => { if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop; }} onChange={(e) => setCode(e.target.value)} spellCheck={false} className="h-[32rem] min-w-0 w-full resize-y bg-transparent p-4 font-mono text-xs leading-6 text-foreground outline-none focus:bg-cyan-500/[.025]" /></div>
            </div><div className="flex min-w-0 flex-col overflow-hidden p-5"><div><p className="font-mono text-xs text-emerald-500">XY toolpath simulation</p><p className="text-xs text-muted-foreground">Amber: feed - cyan dashed: rapid - blue: executed - arcs sampled from I/J</p></div><div className="grid min-h-72 min-w-0 flex-1 place-items-center overflow-hidden py-5"><svg role="img" aria-label="G-code XY simulation" viewBox={`${analysis.bounds.minX - width * .1} ${-analysis.bounds.maxY - height * .1} ${width * 1.2} ${height * 1.2}`} className="max-h-[27rem] min-w-0 max-w-full" preserveAspectRatio="xMidYMid meet">{segments.map(({ from, to, index }) => <path key={index} d={`M ${from.x} ${-from.y} L ${to.x} ${-to.y}`} fill="none" stroke="currentColor" strokeWidth={index === step ? 3 : 1.5} strokeDasharray={to.rapid ? '5 5' : undefined} className={index <= currentIndex ? 'text-blue-500' : to.rapid ? 'text-cyan-500' : 'text-amber-500'} vectorEffect="non-scaling-stroke" />)}<circle cx={current.x} cy={-current.y} r={Math.max(width, height) / 70} fill="currentColor" className="text-emerald-500" /></svg></div><div className="grid grid-cols-3 gap-2 border-t border-border py-3 text-center text-xs"><span>{analysis.motionCount} moves</span><span>{analysis.distance.toFixed(1)} units XY</span><span>{analysis.issues.length} review items</span></div>
                <div className="flex flex-wrap items-center gap-2"><Button onClick={() => { if (step >= last) setStep(0); setPlaying(!playing); }} disabled={!last}>{playing ? 'Pause' : 'Play'}</Button><Button onClick={() => { setPlaying(false); setStep(0); }}>Restart</Button><Button onClick={() => { setPlaying(false); setStep((s) => Math.min(s + 1, last)); }} disabled={step >= last}>Next step</Button><label className="text-xs">Speed <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="rounded border border-border bg-background p-2"><option value={1000}>Slow</option><option value={500}>Normal</option><option value={100}>Fast</option></select></label></div><input type="range" min="0" max={last} value={step} onChange={(e) => { setPlaying(false); setStep(Number(e.target.value)); }} aria-label="Simulation position" className="mt-4 w-full" /><p className="mt-1 text-xs text-muted-foreground">Line {step}/{last} - current XY position X{current.x.toFixed(2)} Y{current.y.toFixed(2)}</p></div>
        </section>{error && <p role="alert" className="text-rose-500">{error}</p>}
        <section className="grid gap-5 lg:grid-cols-2"><div className="min-w-0 overflow-hidden rounded-2xl border border-border p-5"><p className="text-xs text-cyan-500">Code assistant</p><h2 className="mt-2 text-xl font-bold">Insert a command block</h2><div className="mt-4 flex gap-2"><select aria-label="G-code helper command" value={selected} onChange={(e) => setSelected(e.target.value)} className="w-0 min-w-0 flex-1 rounded-lg border border-border bg-background p-3 text-xs">{snippets.map(([name, value]) => <option key={name} value={name}>{name} - {value}</option>)}</select><Button onClick={append}>Insert</Button></div><p className="mt-3 text-xs text-muted-foreground">Safety blocks are examples. Check controller dialect, tool offsets, G54, spindle, feed, stock and limits.</p></div><div className="min-w-0 overflow-hidden rounded-2xl border border-border p-5"><p className="text-xs text-cyan-500">Program review</p><h2 className="mt-2 text-xl font-bold">{analysis.issues.length} items to review</h2><div className="mt-4 max-h-52 space-y-2 overflow-auto">{analysis.issues.length ? analysis.issues.map((issue, i) => <button key={`${issue.line}-${i}`} type="button" onClick={() => { setPlaying(false); setStep(issue.line); textarea.current?.focus(); textarea.current?.setSelectionRange(code.split(/\r?\n/).slice(0, issue.line - 1).join('\n').length, code.split(/\r?\n/).slice(0, issue.line - 1).join('\n').length); }} className={`block w-full rounded-lg bg-foreground/5 p-3 text-left text-xs ${issue.level === 'error' ? 'text-rose-500' : 'text-amber-500'}`}>L{issue.line}: {issue.message}</button>) : <p className="text-sm text-emerald-500">No basic issues found.</p>}</div></div></section><p className="text-xs text-amber-500">Browser simulation is XY only. It does not model tool diameter, Z geometry, fixtures, canned cycles or machine limits. Dry run on the target controller before cutting.</p>
    </div>;
}
function Button({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) { return <button type="button" onClick={onClick} disabled={disabled} className="min-h-10 rounded-lg border border-border px-3 text-xs font-bold disabled:opacity-40">{children}</button>; }
