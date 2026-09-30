'use client';
import { useMemo, useState } from 'react';
import { Maximize2, Pause, Play, RotateCcw, SkipBack, SkipForward, ZoomIn, ZoomOut } from 'lucide-react';
import type { GCodeAnalysis, GCodePoint } from '@/modules/gcode/parser';
import { classifySegments, motionSegments, projectPoint, visibleToolpath, type ClassifiedSegment, type MotionKind, type Plane } from '@/modules/gcode/preview';
import { GCodeButton as Button } from './GCodeButton';
import styles from './GCodeEditor.module.css';
const labels: Record<MotionKind, string> = { cutting: 'Potential cut', air: 'Air feed', rapid: 'Rapid travel', 'rapid-low': 'Rapid below surface', 'spindle-off': 'Feed · spindle off' };
const colors: Record<MotionKind, string> = { cutting: '#10b981', air: '#3b82f6', rapid: '#0891b2', 'rapid-low': '#ef4444', 'spindle-off': '#d97706' };
type Props = { analysis: GCodeAnalysis; step: number; playing: boolean; speed: number; setStep: (step: number) => void; setPlaying: (playing: boolean) => void; setSpeed: (speed: number) => void };
export function GCodeSimulation({ analysis, step, playing, speed, setStep, setPlaying, setSpeed }: Props) {
    const [surfaceZ, setSurfaceZ] = useState(0), [showPlanned, setShowPlanned] = useState(false), [showRapid, setShowRapid] = useState(true);
    const [view, setView] = useState<'both' | 'xy' | 'side'>('both'), [sidePlane, setSidePlane] = useState<Plane>('xz'), [zoom, setZoom] = useState(1);
    const segments = useMemo(() => motionSegments(analysis.points), [analysis.points]);
    const classified = useMemo(() => classifySegments(segments, surfaceZ), [segments, surfaceZ]);
    const visible = visibleToolpath(classified, step, showPlanned, showRapid);
    const frame = step > 0 ? analysis.frames[step - 1] : undefined;
    const currentPoint: GCodePoint = { x: frame?.x ?? 0, y: frame?.y ?? 0, z: frame?.z ?? 0, rapid: frame?.motion === 'rapid', spindleActive: !!frame && frame.spindle !== 'off' && frame.spindleSpeed > 0, line: step, xyKnown: true };
    const currentSegment = classified.findLast(s => s.to.line === step);
    const activeKind = frame?.motion !== 'none' ? currentSegment?.kind : undefined;
    const status = activeKind ? labels[activeKind] : step === 0 ? 'Ready to simulate' : 'No cutting motion';
    const last = analysis.lineCount;
    const seek = (line: number) => { setPlaying(false); setStep(line); };
    return <div className={styles.simulation}>
        <div className={styles.panelHeading}><div><p className={styles.eyebrow}>SIMULATION</p><h2>Toolpath & depth</h2></div><span className={styles.lineBadge}>L{step} / {last}</span></div>
        <div className={styles.playback}>
            <Button primary icon={playing ? <Pause size={16} /> : <Play size={16} />} onClick={() => { if (step >= last) setStep(0); setPlaying(!playing); }} disabled={!analysis.points.length || !last}>{playing ? 'Pause' : step >= last ? 'Replay' : 'Play simulation'}</Button>
            <Button icon={<RotateCcw size={15} />} onClick={() => seek(0)} title="Return to the beginning">Restart</Button>
            <Button icon={<SkipBack size={15} />} onClick={() => seek(Math.max(0, step - 1))} disabled={step === 0}>Previous line</Button>
            <Button icon={<SkipForward size={15} />} onClick={() => seek(Math.min(last, step + 1))} disabled={step >= last}>Next line</Button>
            <label className={styles.speedLabel}>Playback <select aria-label="Playback speed" value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={1200}>Slow</option><option value={650}>Normal</option><option value={200}>Fast</option></select></label>
        </div>
        <label className={styles.timeline}>Program progress<input type="range" min="0" max={last} value={step} onChange={e => seek(Number(e.target.value))} aria-label="Simulation line" /></label>
        <div className={styles.machineStatus} aria-live="polite"><span className={`${styles.statusDot} ${activeKind ? styles[activeKind] : ''}`} /><div><strong>{status}</strong><p>{frame?.code.trim() || 'Press Play or Next line. Both views follow the same program line.'}</p></div></div>
        <div className={styles.viewToolbar}><div className={styles.viewSwitch} role="group" aria-label="Simulation views">{([['both', 'Both views'], ['xy', 'Top · XY'], ['side', 'Depth · Z']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={view === value} onClick={() => setView(value)}>{label}</button>)}</div><div className={styles.zoomControls}><Button icon={<ZoomOut size={15} />} onClick={() => setZoom(z => Math.max(.25, z / 1.5))} aria-label="Zoom out" title="Zoom out" /><Button icon={<ZoomIn size={15} />} onClick={() => setZoom(z => Math.min(8, z * 1.5))} aria-label="Zoom in" title="Zoom in" /><Button icon={<Maximize2 size={15} />} onClick={() => setZoom(1)}>Fit views</Button></div></div>
        <div className={styles.viewports}>
            {view !== 'side' && <Projection plane="xy" segments={visible} points={analysis.points} current={currentPoint} step={step} zoom={zoom} surfaceZ={surfaceZ} expanded={view !== 'both'} />}
            {view !== 'xy' && <Projection plane={sidePlane} segments={visible} points={analysis.points} current={currentPoint} step={step} zoom={zoom} surfaceZ={surfaceZ} expanded={view !== 'both'} sideControl={<select aria-label="Depth view plane" value={sidePlane} onChange={e => setSidePlane(e.target.value as Plane)}><option value="xz">X / Z</option><option value="yz">Y / Z</option></select>} />}
        </div>
        <div className={styles.legend} aria-label="Motion legend">{Object.entries(labels).map(([kind, label]) => <span key={kind}><i className={`${styles.legendStroke} ${styles[kind]}`} />{label}</span>)}<span><i className={styles.plannedStroke} />Planned · faded</span></div>
        <div className={styles.previewOptions}><label><input type="checkbox" checked={showRapid} onChange={e => setShowRapid(e.target.checked)} /> Rapid moves</label><label><input type="checkbox" checked={showPlanned} onChange={e => setShowPlanned(e.target.checked)} /> Show planned path</label><label>Stock top Z <input aria-label="Stock top Z (mm)" type="number" step="0.1" value={surfaceZ} onChange={e => { if (Number.isFinite(e.target.valueAsNumber)) setSurfaceZ(e.target.valueAsNumber); }} /> mm</label></div>
        <p className={styles.surfaceHint}>Green estimates feed below the stock top with the spindle running. The shaded depth region is a surface reference, not the shape of your stock or a material-removal simulation.</p>
        <div className={styles.readouts}><Metric label="Tool position · mm" value={`X ${(frame?.x ?? 0).toFixed(2)} · Y ${(frame?.y ?? 0).toFixed(2)} · Z ${(frame?.z ?? 0).toFixed(2)}`} /><Metric label="Spindle" value={!frame || frame.spindle === 'off' ? 'Off' : `${frame.spindleSpeed} RPM · ${frame.spindle === 'clockwise' ? 'CW' : 'CCW'}`} /><Metric label="Feed / setup" value={`${frame?.feed ?? 0} ${frame?.units ?? 'mm'}/min · ${frame?.workOffset ?? 'G54'}`} /></div>
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
