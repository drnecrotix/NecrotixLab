'use client';

import { useState } from 'react';
import { CopyButton } from './CopyButton';

function encodeUtf8(value: string) { const bytes = new TextEncoder().encode(value); let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte); return btoa(binary); }
function decodeUtf8(value: string) { const binary = atob(value.replace(/\s+/g, '')); const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0)); return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }

export function Base64Codec() {
    const [input, setInput] = useState('NecrotixLab');
    const [output, setOutput] = useState(() => encodeUtf8('NecrotixLab'));
    const [error, setError] = useState('');
    const run = (mode: 'encode' | 'decode') => { try { setOutput(mode === 'encode' ? encodeUtf8(input) : decodeUtf8(input)); setError(''); } catch { setOutput(''); setError('The input is not valid Base64 or UTF-8 text.'); } };
    const area = 'mt-2 w-full resize-y rounded-xl border border-border bg-foreground/[0.02] p-4 font-mono text-sm leading-6 outline-none focus:ring-2 focus:ring-cyan-500';
    return <section className="grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-border p-5 sm:p-6"><label className="text-xs font-bold">Input<textarea value={input} onChange={(event) => setInput(event.target.value)} rows={10} spellCheck={false} className={area} /></label><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => run('encode')} className="min-h-11 rounded-lg bg-foreground px-4 text-xs font-bold text-background">Encode</button><button type="button" onClick={() => run('decode')} className="min-h-11 rounded-lg border border-border px-4 text-xs font-bold">Decode</button></div>{error ? <p className="mt-3 text-xs text-rose-500">{error}</p> : null}</div><div className="rounded-2xl border border-border p-5 sm:p-6"><div className="flex items-center justify-between"><p className="text-xs font-bold">Output</p><CopyButton value={output} /></div><pre className="mt-4 min-h-64 whitespace-pre-wrap break-all rounded-xl bg-foreground/[0.03] p-4 font-mono text-sm leading-6">{output}</pre></div></section>;
}
