'use client';

import { useState } from 'react';

const MAX_PREVIEW_BYTES = 4096;

function hexRows(bytes: Uint8Array) {
    const rows: string[] = [];
    for (let offset = 0; offset < bytes.length; offset += 16) {
        const slice = bytes.slice(offset, offset + 16);
        const address = offset.toString(16).padStart(8, '0').toUpperCase();
        const hex = Array.from(slice, (byte) => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ').padEnd(47, ' ');
        const ascii = Array.from(slice, (byte) => byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.').join('');
        rows.push(`${address}  ${hex}  |${ascii}|`);
    }
    return rows.join('\n');
}

function signature(bytes: Uint8Array) {
    const head = Array.from(bytes.slice(0, 12), (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
    if (head.startsWith('25504446')) return 'PDF document';
    if (head.startsWith('89504E470D0A1A0A')) return 'PNG image';
    if (head.startsWith('FFD8FF')) return 'JPEG image';
    if (head.startsWith('504B0304')) return 'ZIP / Office container';
    if (head.startsWith('47494638')) return 'GIF image';
    if (head.startsWith('4D5A')) return 'Windows executable';
    if (head.startsWith('7F454C46')) return 'ELF executable';
    return 'Unknown signature';
}

export function HexViewer() {
    const [result, setResult] = useState<{ name: string; size: number; type: string; signature: string; preview: string; truncated: boolean } | null>(null);
    const inspect = async (file: File | null) => {
        if (!file) { setResult(null); return; }
        const buffer = await file.slice(0, MAX_PREVIEW_BYTES).arrayBuffer();
        const bytes = new Uint8Array(buffer);
        setResult({ name: file.name, size: file.size, type: file.type || 'Unknown MIME type', signature: signature(bytes), preview: hexRows(bytes), truncated: file.size > bytes.length });
    };
    return <section><label className="grid min-h-44 cursor-pointer place-items-center rounded-2xl border border-dashed border-border bg-foreground/[0.015] p-6 text-center transition hover:border-cyan-500/60"><input type="file" className="sr-only" onChange={(event) => void inspect(event.target.files?.[0] ?? null)} /><span><span className="block text-sm font-bold">Open a file locally</span><span className="mt-2 block text-xs leading-6 text-muted-foreground">The first 4 KB will be displayed. The file never leaves your device.</span></span></label>{result ? <div className="mt-6"><div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">{[['File', result.name], ['Size', `${result.size.toLocaleString()} bytes`], ['Detected', result.signature], ['Browser type', result.type]].map(([label, value]) => <div key={label} className="bg-background p-4"><p className="font-mono text-[9px] uppercase tracking-wider text-cyan-500">{label}</p><p className="mt-2 break-all text-xs font-semibold">{value}</p></div>)}</div><pre className="mt-4 max-h-[34rem] overflow-auto rounded-xl border border-border bg-black p-4 font-mono text-[11px] leading-6 text-zinc-300">{result.preview}</pre>{result.truncated ? <p className="mt-3 text-xs text-muted-foreground">Preview limited to the first {MAX_PREVIEW_BYTES.toLocaleString()} bytes for browser performance.</p> : null}</div> : null}</section>;
}
