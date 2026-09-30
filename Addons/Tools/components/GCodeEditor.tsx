'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Download, FileInput, ListRestart, Search, Sparkles, TextCursorInput, WrapText } from 'lucide-react';
import { GCodeSimulation } from './GCodeSimulation';
import { GCodeButton as Button } from './GCodeButton';
import styles from './GCodeEditor.module.css';
import { analyzeGCode } from '@/modules/gcode/parser';
import { formatGCode, insertAtSelection, toggleLineComment } from '@/modules/gcode/editor';

const starter = `(NecrotixLab starter program)
G21 G90 G17 G94 G40 G49 G80
G54
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
    ['Clockwise arc', 'G2 X20 Y20 I0 J5'], ['Counterclockwise arc', 'G3 X20 Y20 I0 J5'], ['Spindle on', 'M3 S12000'],
    ['Spindle off', 'M5'], ['Coolant on', 'M8'], ['Coolant off', 'M9'], ['Tool change', 'T1 M6'], ['End program', 'M30'],
] as const;
function save(code: string, extension: string) { const url = URL.createObjectURL(new Blob([code], { type: 'text/plain;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = `necrotixlab-program.${extension}`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export function GCodeEditor() {
    const [ready, setReady] = useState(false);
    useEffect(() => { setReady(true); }, []);
    const [code, setCode] = useState(starter), [selected, setSelected] = useState<string>(snippets[0][0]);
    const [step, setStep] = useState(0), [playing, setPlaying] = useState(false), [speed, setSpeed] = useState(650), [error, setError] = useState('');
    const [find, setFind] = useState(''), [replace, setReplace] = useState(''), [matches, setMatches] = useState(0), [wrap, setWrap] = useState(false), [cursorLine, setCursorLine] = useState(1), [exportFormat, setExportFormat] = useState('nc');
    const fileInput = useRef<HTMLInputElement>(null), textarea = useRef<HTMLTextAreaElement>(null), gutter = useRef<HTMLDivElement>(null);
    const analysis = useMemo(() => analyzeGCode(code), [code]);
    const last = analysis.lineCount;
    useEffect(() => { if (!playing) return; if (step >= last) { setPlaying(false); return; } const timer = window.setTimeout(() => setStep((s) => Math.min(s + 1, last)), speed); return () => window.clearTimeout(timer); }, [playing, step, last, speed]);
    useEffect(() => { setPlaying(false); setStep(0); }, [code]);
    useEffect(() => { if (step > 0 && textarea.current) textarea.current.scrollTop = Math.max(0, (step - 5) * 24); }, [step, playing]);
    const updateCursorLine = () => { const area = textarea.current; if (area) setCursorLine(code.slice(0, area.selectionStart).split('\n').length); };
    const insert = (snippet: string) => { const area = textarea.current; const start = area?.selectionStart ?? code.length, end = area?.selectionEnd ?? code.length; const before = start > 0 && code[start - 1] !== '\n' ? '\n' : ''; const after = end < code.length && code[end] !== '\n' ? '\n' : ''; const result = insertAtSelection(code, start, end, `${before}${snippet}${after}`); setCode(result.text); requestAnimationFrame(() => { area?.focus(); area?.setSelectionRange(result.cursor, result.cursor); }); };
    const importFile = async (file?: File) => { if (!file) return; if (!/\.(nc|txt)$/i.test(file.name) || file.size > 1_000_000) { setError('Choose a .nc or .txt file up to 1 MB.'); return; } setError(''); try { setCode((await file.text()).replace(/\r\n?/g, '\n')); } catch { setError('Could not read the selected file.'); } if (fileInput.current) fileInput.current.value = ''; };
    const findNext = () => { if (!find) return; const area = textarea.current; if (!area) return; const index = code.toLowerCase().indexOf(find.toLowerCase(), area.selectionEnd); const next = index >= 0 ? index : code.toLowerCase().indexOf(find.toLowerCase()); if (next < 0) return; area.focus(); area.setSelectionRange(next, next + find.length); area.scrollTop = Math.max(0, (code.slice(0, next).split('\n').length - 4) * 24); updateCursorLine(); };
    const replaceOne = () => { const area = textarea.current; if (!area || !find) return; const selectedText = code.slice(area.selectionStart, area.selectionEnd); if (selectedText.toLowerCase() !== find.toLowerCase()) { findNext(); return; } const result = insertAtSelection(code, area.selectionStart, area.selectionEnd, replace); setCode(result.text); setMatches((n) => n + 1); requestAnimationFrame(() => { area.focus(); area.setSelectionRange(result.cursor, result.cursor); }); };
    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        const area = event.currentTarget;
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); save(code, exportFormat); return; }
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); if (step >= last) setStep(0); setPlaying((value) => !value); return; }
        if ((event.ctrlKey || event.metaKey) && event.key === '/') { event.preventDefault(); const result = toggleLineComment(code, area.selectionStart, area.selectionEnd); setCode(result.text); requestAnimationFrame(() => area.setSelectionRange(result.start, result.end)); return; }
        if (event.key === 'Tab') { event.preventDefault(); const result = insertAtSelection(code, area.selectionStart, area.selectionEnd, '  '); setCode(result.text); requestAnimationFrame(() => area.setSelectionRange(result.cursor, result.cursor)); }
    };
    return <div className="space-y-5">{!analysis.previewComplete && <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-500">Incomplete preview - unsupported or invalid geometry stops the path. Review the flagged line; later positions are not reliable.</p>}
        <section className={`${styles.workbench} min-w-0 max-w-full rounded-2xl border border-border`}>
            <div className="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
                <div className={styles.editorHeader}><div><p className={styles.eyebrow}>PROGRAM</p><h2>G-code editor</h2><p className={styles.editorMeta}>Cursor L{cursorLine} · simulation L{step}/{last}</p></div><div className={styles.fileActions}><input ref={fileInput} className="hidden" type="file" accept=".nc,.txt,text/plain" onChange={(e) => void importFile(e.target.files?.[0])} /><Button icon={<FileInput size={16} />} onClick={() => fileInput.current?.click()}>Open file</Button><label className={styles.exportFormat}><span className="sr-only">Export file format</span><select aria-label="Export file format" value={exportFormat} onChange={e => setExportFormat(e.target.value)}><option value="nc">.nc</option><option value="txt">.txt</option></select></label><Button primary icon={<Download size={16} />} onClick={() => save(code, exportFormat)}>Export file</Button></div></div>
                <div className={styles.editToolbar}><Button icon={<Sparkles size={15} />} onClick={() => setCode(formatGCode(code))} title="Normalize spacing without changing commands">Format code</Button><Button icon={<TextCursorInput size={15} />} onClick={() => insert('G21 G90 G17 G94 G40 G49 G80\nG54\nG0 Z5')}>Insert safe start</Button><Button icon={<ListRestart size={15} />} onClick={() => { if (window.confirm('Replace the current program with the starter example?')) setCode(starter); }}>Load example</Button><label className={styles.wrapToggle}><WrapText size={15} /><input type="checkbox" checked={wrap} onChange={e => setWrap(e.target.checked)} /> Wrap lines</label></div>
                <div className={`${styles.editorSurface} ${wrap ? styles.editorSurfaceWrapped : ''} bg-foreground/[.025]`}><div ref={gutter} aria-hidden="true" className={`${styles.gutter} ${wrap ? "hidden" : ""} border-r border-border text-right text-muted-foreground/60`}>{code.split(/\r?\n/).map((_, i) => <div key={i} className={`pr-3 ${step === i + 1 ? 'bg-cyan-500/25 font-bold text-cyan-500' : ''}`}>{i + 1}</div>)}</div><textarea ref={textarea} aria-label="G-Code program" disabled={!ready} value={code} onScroll={(e) => { if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop; }} onClick={updateCursorLine} onKeyUp={updateCursorLine} onKeyDown={onKeyDown} onChange={(e) => { setCode(e.target.value.replace(/\r\n?/g, '\n')); setCursorLine(e.target.value.slice(0, e.target.selectionStart).split('\n').length); }} spellCheck={false} wrap={wrap ? 'soft' : 'off'} className="bg-transparent text-foreground outline-none focus:bg-cyan-500/[.025]" /></div>
                <div className="grid gap-2 border-t border-border p-3 sm:grid-cols-[1fr_1fr_auto_auto]"><input aria-label="Find code" placeholder="Find" value={find} onChange={(e) => setFind(e.target.value)} className="min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-xs" /><input aria-label="Replace code" placeholder="Replace" value={replace} onChange={(e) => setReplace(e.target.value)} className="min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-xs" /><Button icon={<Search size={15} />} onClick={findNext} disabled={!find}>Find next</Button><Button onClick={replaceOne} disabled={!find}>Replace match</Button></div>
            </div>
            <GCodeSimulation analysis={analysis} step={step} playing={playing} speed={speed} setStep={setStep} setPlaying={setPlaying} setSpeed={setSpeed} />
        </section><p className={styles.shortcuts}>Ctrl+S export · Ctrl+/ comment · Ctrl+Enter play/pause · Tab indent</p>{error && <p role="alert" className="text-rose-500">{error}</p>}
        <section className="grid gap-5 lg:grid-cols-2"><div className="min-w-0 overflow-hidden rounded-2xl border border-border p-5"><p className="text-xs text-cyan-500">Code assistant</p><h2 className="mt-2 text-xl font-bold">Insert at cursor</h2><p className="mt-2 text-xs text-muted-foreground">Select the target line before inserting. Review controller syntax and machine clearances.</p><div className="mt-4 flex gap-2"><select aria-label="G-code helper command" value={selected} onChange={(e) => setSelected(e.target.value)} className="w-0 min-w-0 flex-1 rounded-lg border border-border bg-background p-3 text-xs">{snippets.map(([name, value]) => <option key={name} value={name}>{name} - {value}</option>)}</select><Button onClick={() => insert(snippets.find(([name]) => name === selected)?.[1] ?? '')}>Insert</Button></div><p className="mt-3 text-xs text-muted-foreground">Safe start is an example, not a machine-specific guarantee. Check G54, tool offsets, spindle, stock and limits.</p></div><div className="min-w-0 overflow-hidden rounded-2xl border border-border p-5"><p className="text-xs text-cyan-500">Program review</p><h2 className="mt-2 text-xl font-bold">{analysis.issues.length} items to review</h2><div className="mt-4 max-h-52 space-y-2 overflow-auto">{analysis.issues.length ? analysis.issues.map((issue, i) => <button key={`${issue.line}-${i}`} type="button" onClick={() => { setPlaying(false); setStep(issue.line); const offset = code.split(/\r?\n/).slice(0, issue.line - 1).join('\n').length + (issue.line > 1 ? 1 : 0); if (textarea.current) textarea.current.scrollTop = Math.max(0, (issue.line - 4) * 24); textarea.current?.focus(); textarea.current?.setSelectionRange(offset, offset); }} className={`block w-full rounded-lg bg-foreground/5 p-3 text-left text-xs ${issue.level === 'error' ? 'text-rose-500' : 'text-amber-500'}`}>L{issue.line}: {issue.message}</button>) : <p className="text-sm text-emerald-500">No basic issues found.</p>}</div></div></section><p className="text-xs text-amber-500">Surface-based preview does not model stock boundaries, tool diameter, fixtures, machine limits, cutter compensation, canned cycles or material removal. Verify on the target controller before cutting.</p><span className="sr-only" aria-live="polite">{matches ? `${matches} replacements made` : ''}</span>
    </div>;
}
