'use client';

import { useState } from 'react';
import { CopyButton } from './CopyButton';

type HashResult = { algorithm: string; value: string };
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export function FileHashTool() {
    const [file, setFile] = useState<File | null>(null);
    const [hashes, setHashes] = useState<HashResult[]>([]);
    const [status, setStatus] = useState('');
    const inspect = async (selected: File | null) => {
        setFile(selected); setHashes([]); setStatus('');
        if (!selected) return;
        if (selected.size > MAX_FILE_SIZE) { setStatus('Choose a file up to 50 MB.'); return; }
        setStatus('Calculating locally...');
        try {
            const data = await selected.arrayBuffer();
            const results = await Promise.all(['SHA-256', 'SHA-384', 'SHA-512'].map(async (algorithm) => {
                const digest = await crypto.subtle.digest(algorithm, data);
                return { algorithm, value: Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('') };
            }));
            setHashes(results); setStatus('');
        } catch { setStatus('The file could not be processed in this browser.'); }
    };
    return <section><label className="group grid min-h-48 cursor-pointer place-items-center rounded-2xl border border-dashed border-border bg-foreground/[0.015] p-6 text-center transition hover:border-cyan-500/60"><input type="file" className="sr-only" onChange={(event) => void inspect(event.target.files?.[0] ?? null)} /><span><span className="block text-sm font-bold">Choose a file</span><span className="mt-2 block text-xs leading-6 text-muted-foreground">SHA-256, SHA-384 and SHA-512 - maximum 50 MB</span></span></label>{file ? <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><span>{file.name}</span><span>{file.size.toLocaleString()} bytes</span><span>{file.type || 'unknown type'}</span></div> : null}{status ? <p className="mt-4 text-sm text-muted-foreground">{status}</p> : null}<div className="mt-6 grid gap-3">{hashes.map((hash) => <article key={hash.algorithm} className="rounded-xl border border-border p-4"><div className="flex items-center justify-between gap-3"><p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-500">{hash.algorithm}</p><CopyButton value={hash.value} /></div><p className="mt-4 break-all font-mono text-xs leading-6">{hash.value}</p></article>)}</div></section>;
}
