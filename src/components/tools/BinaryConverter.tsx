'use client';

import { useMemo, useState } from 'react';
import { CopyButton } from './CopyButton';

const inputClass = 'w-full rounded-xl border border-border bg-foreground/[0.02] px-4 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-cyan-500';

function parseInteger(value: string, base: number) {
    const clean = value.trim().replaceAll('_', '').replaceAll(' ', '');
    if (!clean) return null;
    const patterns: Record<number, RegExp> = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^\d+$/, 16: /^[0-9a-f]+$/i };
    if (!patterns[base]?.test(clean)) return null;
    try { return BigInt(base === 16 ? `0x${clean}` : base === 8 ? `0o${clean}` : base === 2 ? `0b${clean}` : clean); } catch { return null; }
}

export function BinaryConverter() {
    const [value, setValue] = useState('11001010');
    const [base, setBase] = useState(2);
    const parsed = useMemo(() => parseInteger(value, base), [value, base]);
    const outputs = parsed === null ? [] : [
        ['Binary', parsed.toString(2)], ['Octal', parsed.toString(8)], ['Decimal', parsed.toString(10)], ['Hexadecimal', parsed.toString(16).toUpperCase()],
    ];
    return <section className="grid gap-6 lg:grid-cols-[.72fr_1.28fr]">
        <div className="rounded-2xl border border-border p-5 sm:p-6"><label className="text-xs font-bold">Input base<select value={base} onChange={(event) => setBase(Number(event.target.value))} className={`${inputClass} mt-2`}><option value={2}>Binary (base 2)</option><option value={8}>Octal (base 8)</option><option value={10}>Decimal (base 10)</option><option value={16}>Hexadecimal (base 16)</option></select></label><label className="mt-5 block text-xs font-bold">Value<textarea value={value} onChange={(event) => setValue(event.target.value)} rows={6} spellCheck={false} className={`${inputClass} mt-2 resize-y`} /></label>{value && parsed === null ? <p className="mt-3 text-xs text-rose-500">The value contains characters that are invalid for the selected base.</p> : null}</div>
        <div className="grid gap-3">{outputs.length ? outputs.map(([label, output]) => <article key={label} className="rounded-xl border border-border p-4"><div className="flex items-center justify-between gap-3"><p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-500">{label}</p><CopyButton value={output!} /></div><p className="mt-4 break-all font-mono text-sm leading-6">{output}</p></article>) : <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">Enter a valid value to convert it.</div>}</div>
    </section>;
}
