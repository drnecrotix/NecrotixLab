'use client';
import { useMemo, useState } from 'react';
import { Maximize2, Pause, Play, RotateCcw, SkipBack, SkipForward, ZoomIn, ZoomOut } from 'lucide-react';
import type { GCodeAnalysis, GCodePoint } from '@/modules/gcode/parser';
import { classifySegments, motionSegments, projectPoint, visibleToolpath, type ClassifiedSegment, type MotionKind, type Plane } from '@/modules/gcode/preview';
import { GCodeButton as Button } from './GCodeButton';
import { interpolateBlock } from '@/modules/gcode/playback';
import styles from './GCodeEditor.module.css';
const labels: Record<MotionKind, string> = { cutting: 'Potential cut', air: 'Air feed', rapid: 'Rapid travel', 'rapid-low': 'Rapid below surface', 'spindle-off': 'Feed · spindle off' };
const colors: Record<MotionKind, string> = { cutting: '#10b981', air: '#3b82f6', rapid: '#0891b2', 'rapid-low': '#ef4444', 'spindle-off': '#d97706' };
type Props = { fraction: number; analysis: GCodeAnalysis; step: number; playing: boolean; speed: number; setStep: (step: number) => void; setPlaying: (playing: boolean) => void; setSpeed: (speed: number) => void };
export function GCodeSimulation({ fraction, analysis, step, playing, speed, setStep, setPlaying, setSpeed }: Props) {
    const [surfaceZ, setSurfaceZ] = useState(0), [showPlanned, setShowPlanned] = useState(false), [showRapid, setShowRapid] = useState(true);
    const [view, setView] = useState<'iso' | 'both' | 'xy' | 'side'>('iso'), [sidePlane, setSidePlane] = useState<Plane>('xz'), [zoom, setZoom] = useState(1);
    const segments = useMemo(() => motionSegments(analysis.points), [analysis.points]);
    const classified = useMemo(() => classifySegments(segments, surfaceZ), [segments, surfaceZ]);
    const activeLine = fraction > 0 && step < analysis.lineCount ? step + 1 : step;
    const visible = visibleToolpath(classified, step, showPlanned, showRapid).filter(s => fraction <= 0 || s.to.line !== activeLine);
    const completedFrame = step > 0 ? analysis.frames[step - 1] : undefined;
    const frame = activeLine > 0 ? analysis.frames[activeLine - 1] : undefined;
    const endpoint: GCodePoint = { x: completedFrame?.x ?? 0, y: completedFrame?.y ?? 0, z: completedFrame?.z ?? 0, rapid: frame?.motion === 'rapid', spindleActive: !!frame && frame.spindle !== 'off' && frame.spindleSpeed > 0, line: activeLine, xyKnown: true };
    const currentPoint = fraction > 0 ? interpolateBlock(analysis.points, activeLine, fraction, endpoint) : endpoint;
    const activeSegments = classified.filter(s => s.to.line === activeLine);
    if (fraction > 0) {
        let remaining = activeSegments.reduce((sum, s) => sum + Math.hypot(s.to.x-s.from.x, s.to.y-s.from.y, s.to.z-s.from.z), 0) * fraction;
        for (const s of activeSegments) {
            const length = Math.hypot(s.to.x-s.from.x, s.to.y-s.from.y, s.to.z-s.from.z);
            if (remaining <= 0) break;
            if (showRapid || !s.to.rapid) visible.push(remaining >= length ? s : { ...s, to: currentPoint });
            remaining -= length;
        }
    }
    const currentSegment = classified.findLast(s => s.to.line === activeLine);
    const activeKind = frame?.motion !== 'none' ? currentSegment?.kind : undefined;
    const status = activeKind ? labels[activeKind] : step === 0 ? 'Ready to simulate' : 'No cutting motion';
    const last = analysis.lineCount;
    const seek = (line: number) => { setPlaying(false); setStep(line); };
    return <div className={styles.simulation}>
        <div className={styles.panelHeading}><div><p className={styles.eyebrow}>SIMULATION</p><h2>Machine & toolpath</h2></div><span className={styles.lineBadge}>L{step} / {last}</span></div>
        {!analysis.previewComplete && <p role="status" className="my-3 rounded-lg border border-amber-500/40 p-3 text-xs text-amber-500">Incomplete preview: some commands cannot be modelled. Review the program warnings.</p>}
        <div className={styles.playback}>
            <Button primary icon={playing ? <Pause size={16} /> : <Play size={16} />} onClick={() => { if (step >= last) setStep(0); setPlaying(!playing); }} disabled={!analysis.points.length || !last}>{playing ? 'Pause' : step >= last ? 'Replay' : 'Play simulation'}</Button>
            <Button icon={<RotateCcw size={15} />} onClick={() => seek(0)} title="Return to the beginning">Restart</Button>
            <Button icon={<SkipBack size={15} />} onClick={() => seek(Math.max(0, step - 1))} disabled={step === 0}>Previous line</Button>
            <Button icon={<SkipForward size={15} />} onClick={() => seek(Math.min(last, step + 1))} disabled={step >= last}>Next line</Button>
            <label className={styles.speedLabel}>Playback <select aria-label="Playback speed" value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={1200}>Slow</option><option value={650}>Normal</option><option value={200}>Fast</option></select></label>
        </div>
        <label className={styles.timeline}>Completed blocks<input type="range" min="0" max={last} value={step} onChange={e => seek(Number(e.target.value))} aria-label="Simulation line" /></label>
        <div className={styles.machineStatus} aria-live="polite"><span className={`${styles.statusDot} ${activeKind ? styles[activeKind] : ''}`} /><div><strong>{status}</strong><p>{frame?.code.trim() || 'Press Play or Next line. Both views follow the same program line.'}</p></div></div>
        <div className={styles.viewToolbar}><div className={styles.viewSwitch} role="group" aria-label="Simulation views">{([['iso', 'Machine · 3D'], ['both', 'Both views'], ['xy', 'Top · XY'], ['side', 'Depth · Z']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={view === value} onClick={() => setView(value)}>{label}</button>)}</div><div className={styles.zoomControls}><Button icon={<ZoomOut size={15} />} onClick={() => setZoom(z => Math.max(.25, z / 1.5))} aria-label="Zoom out" title="Zoom out" /><Button icon={<ZoomIn size={15} />} onClick={() => setZoom(z => Math.min(8, z * 1.5))} aria-label="Zoom in" title="Zoom in" /><Button icon={<Maximize2 size={15} />} onClick={() => setZoom(1)}>Fit views</Button></div></div>
        <div className={styles.viewports}>
            {view === 'iso' && <MachineView segments={visible} points={analysis.points} current={currentPoint} surfaceZ={surfaceZ} zoom={zoom} spindleActive={currentPoint.spindleActive} playing={playing} />}
            {view !== 'side' && view !== 'iso' && <Projection plane="xy" segments={visible} points={analysis.points} current={currentPoint} step={activeLine} zoom={zoom} surfaceZ={surfaceZ} expanded={view !== 'both'} />}
            {view !== 'xy' && view !== 'iso' && <Projection plane={sidePlane} segments={visible} points={analysis.points} current={currentPoint} step={activeLine} zoom={zoom} surfaceZ={surfaceZ} expanded={view !== 'both'} sideControl={<select aria-label="Depth view plane" value={sidePlane} onChange={e => setSidePlane(e.target.value as Plane)}><option value="xz">X / Z</option><option value="yz">Y / Z</option></select>} />}
        </div>
        <div className={styles.legend} aria-label="Motion legend">{Object.entries(labels).map(([kind, label]) => <span key={kind}><i className={`${styles.legendStroke} ${styles[kind]}`} />{label}</span>)}<span><i className={styles.plannedStroke} />Planned · faded</span></div>
        <div className={styles.previewOptions}><label><input type="checkbox" checked={showRapid} onChange={e => setShowRapid(e.target.checked)} /> Rapid moves</label><label><input type="checkbox" checked={showPlanned} onChange={e => setShowPlanned(e.target.checked)} /> Show planned path</label><label>Stock top Z <input aria-label="Stock top Z (mm)" type="number" step="0.1" value={surfaceZ} onChange={e => { if (Number.isFinite(e.target.valueAsNumber)) setSurfaceZ(e.target.valueAsNumber); }} /> mm</label></div>
        <p className={styles.surfaceHint}>Playback is accelerated and feed-aware; rapid assumes 6000 mm/min. Green estimates feed below the stock top with the spindle running. The shaded depth region is a surface reference, not the shape of your stock or a material-removal simulation.</p>
        <div className={styles.readouts}><Metric label="Tool position · mm" value={`X ${currentPoint.x.toFixed(2)} · Y ${currentPoint.y.toFixed(2)} · Z ${currentPoint.z.toFixed(2)}`} /><Metric label="Tool / coolant" value={`T${frame?.tool ?? "-"} · coolant ${frame?.coolant ? "on" : "off"}`} /><Metric label="Spindle" value={!frame || frame.spindle === 'off' ? 'Off' : `${frame.spindleSpeed} RPM · ${frame.spindle === 'clockwise' ? 'CW' : 'CCW'}`} /><Metric label="Feed / setup" value={`${frame?.feed ?? 0} ${frame?.units ?? 'mm'}/min · ${frame?.workOffset ?? 'G54'}`} /></div>
    </div>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function Projection({ plane, segments, points, current, step, zoom, surfaceZ, expanded, sideControl }: { plane: Plane; segments: ClassifiedSegment[]; points: GCodePoint[]; current: GCodePoint; step: number; zoom: number; surfaceZ: number; expanded: boolean; sideControl?: React.ReactNode }) {
    const projected = points.filter(p => p.line > 0).map(p => projectPoint(p, plane));
    if (!projected.length) projected.push({ x: 0, y: 0 });
    const bounds = projected.reduce((b, p) => ({ minX: Math.min(b.minX, p.x), maxX: Math.max(b.maxX, p.x), minY: Math.min(b.minY, p.y), maxY: Math.max(b.maxY, p.y) }), { minX: projected[0].x, maxX: projected[0].x, minY: projected[0].y, maxY: projected[0].y });
    const { minX, maxX } = bounds;
    const minY = plane === 'xy' ? bounds.minY : Math.min(bounds.minY, surfaceZ - 2), maxY = plane === 'xy' ? bounds.maxY : Math.max(bounds.maxY, surfaceZ + 2);
    const width = Math.max(maxX - minX, 10) * 1.25 / zoom, height = Math.max(maxY - minY, plane === 'xy' ? width / 3 : 8) * 1.25 / zoom;
    const left = (minX + maxX - width) / 2, top = -(minY + maxY + height) / 2;
    const p = projectPoint(current, plane), visiblePoint = step > 0 && points.some(point => point.line <= step && point.line > 0);
    const isSide = plane !== 'xy';
    return <div className={styles.projection}><header><strong>{isSide ? 'Depth view' : 'Top view'} <span>{plane.toUpperCase()} · mm</span></strong>{sideControl ?? <span>Looking down Z</span>}</header><svg role="img" aria-label={`G-code ${plane.toUpperCase()} simulation`} viewBox={`${left} ${top} ${width} ${height}`} className={`${styles.preview} ${expanded ? styles.expandedPreview : ''}`} preserveAspectRatio="xMidYMid meet">
        {isSide && <><rect x={left} y={Math.max(top, -surfaceZ)} width={width} height={Math.max(0, top + height - Math.max(top, -surfaceZ))} className={styles.stockRegion} /><line x1={left} y1={-surfaceZ} x2={left + width} y2={-surfaceZ} className={styles.surfaceLine} vectorEffect="non-scaling-stroke" /></>}
        {segments.map((s, i) => { const a = projectPoint(s.from, plane), b = projectPoint(s.to, plane); if (a.x === b.x && a.y === b.y) return null; return <path data-motion={s.kind} key={`${s.index}-${i}`} d={`M ${a.x} ${-a.y} L ${b.x} ${-b.y}`} fill="none" stroke={colors[s.kind]} strokeWidth={s.to.line === step ? 3 : s.kind === 'cutting' ? 2.25 : 1.5} strokeDasharray={s.kind === 'cutting' ? undefined : s.kind === 'spindle-off' ? '2 4' : '6 4'} opacity={s.to.line > step ? .28 : 1} vectorEffect="non-scaling-stroke"><title>{`Line ${s.to.line} · ${labels[s.kind]}${s.to.line > step ? ' · planned' : ''}`}</title></path>; })}
        {visiblePoint && <circle cx={p.x} cy={-p.y} r={Math.min(width, height) / 32} className={styles.toolMarker} strokeWidth="2" vectorEffect="non-scaling-stroke"><title>{`Tool tip · X${current.x.toFixed(2)} Y${current.y.toFixed(2)} Z${current.z.toFixed(2)} mm`}</title></circle>}
    </svg><footer><span>{isSide ? `Stock top Z = ${surfaceZ.toFixed(2)} mm` : 'Tool center path · X / Y'}</span><span>{isSide ? '+Z up · depth below surface' : 'Solid: potential cut · dashed: travel'}</span></footer></div>;
}

function MachineView({ segments, points, current, surfaceZ, zoom, spindleActive, playing }: { segments: ClassifiedSegment[]; points: GCodePoint[]; current: GCodePoint; surfaceZ: number; zoom: number; spindleActive: boolean; playing: boolean }) {
    const project = (p: { x: number; y: number; z: number }) => ({ x: (p.x - p.y) * .866, y: (p.x + p.y) * .5 - p.z });
    const projected = [...points, current].map(project);
    const minX = projected.reduce((v,p) => Math.min(v,p.x), Infinity), maxX = projected.reduce((v,p) => Math.max(v,p.x), -Infinity);
    const minY = projected.reduce((v,p) => Math.min(v,p.y), Infinity), maxY = projected.reduce((v,p) => Math.max(v,p.y), -Infinity);
    const span = Math.max(40, maxX-minX, maxY-minY), width = span * 1.6 / zoom, height = span * 1.25 / zoom;
    const path = (ps: { x: number; y: number; z: number }[]) => ps.map((p,i) => { const q = project(p); return `${i ? 'L' : 'M'} ${q.x} ${q.y}`; }).join(' ');
    const bx = points.reduce((v,p) => Math.min(v,p.x),0) - 5, by = points.reduce((v,p) => Math.min(v,p.y),0) - 5;
    const ex = points.reduce((v,p) => Math.max(v,p.x),20) + 5, ey = points.reduce((v,p) => Math.max(v,p.y),20) + 5;
    const corners = [{x:bx,y:by,z:surfaceZ},{x:ex,y:by,z:surfaceZ},{x:ex,y:ey,z:surfaceZ},{x:bx,y:ey,z:surfaceZ}];
    const tip = project(current), toolSize = span / 45;
    return <div className={styles.projection}><header><strong>Isometric milling preview</strong><span>XYZ · mm · illustrative stock</span></header><svg role="img" aria-label="Isometric CNC milling simulation" className={`${styles.preview} ${styles.machinePreview}`} viewBox={`${(minX+maxX-width)/2} ${(minY+maxY-height)/2 - span*.1} ${width} ${height}`}>
        <path d={`${path(corners)} Z`} className={styles.stockRegion} stroke="#64748b" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {[1,2].map(i => <path key={i} d={`${path([corners[i], corners[(i+1)%4], {...corners[(i+1)%4],z:surfaceZ-5}, {...corners[i],z:surfaceZ-5}])} Z`} fill="#64748b" opacity=".18" stroke="#64748b" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
        {Array.from({length:9},(_,i) => <path key={i} d={path([{x:bx+(ex-bx)*i/8,y:by,z:surfaceZ},{x:bx+(ex-bx)*i/8,y:ey,z:surfaceZ}])} stroke="#64748b" opacity=".2" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
        {segments.map((s,i) => <path key={i} d={path([s.from,s.to])} fill="none" stroke={colors[s.kind]} strokeWidth={s.kind === 'cutting' ? 2.5 : 1.5} strokeDasharray={s.to.rapid ? '5 4' : undefined} opacity={s.to.line > current.line ? .2 : 1} vectorEffect="non-scaling-stroke" />)}
        <g transform={`translate(${tip.x} ${tip.y})`}><line x1="0" y1="0" x2="0" y2={-toolSize*9} stroke="#94a3b8" strokeWidth={toolSize*2} /><rect x={-toolSize*2} y={-toolSize*12} width={toolSize*4} height={toolSize*5} rx={toolSize} fill="#475569" stroke="#94a3b8" strokeWidth="1" vectorEffect="non-scaling-stroke" /><g className={spindleActive && playing ? styles.spinningTool : undefined}><path d={`M ${-toolSize} ${-toolSize*4} L ${toolSize} 0 M ${toolSize} ${-toolSize*4} L ${-toolSize} 0`} stroke={spindleActive ? '#22d3ee' : '#94a3b8'} strokeWidth="2" vectorEffect="non-scaling-stroke" /></g><circle r={toolSize*.5} fill="#f8fafc" /></g>
    </svg><footer><span>Workpiece top Z {surfaceZ.toFixed(2)} mm</span><span>Tool tip follows sampled arcs · stock is illustrative</span></footer></div>;
}
