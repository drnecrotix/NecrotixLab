'use client';

import { useState } from 'react';
import { CheckCircle2, Download, ShieldAlert, ShieldCheck } from 'lucide-react';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
type Finding = { label: string; value: string; risk?: boolean };
type Inspection = { file: File; kind: 'pdf' | 'image' | 'other'; findings: Finding[]; sha256: string; canClean: boolean };

function hex(bytes: Uint8Array) { return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(''); }
function safeValue(value: unknown) {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value).slice(0, 180);
    if (Array.isArray(value)) return value.slice(0, 8).map(String).join(', ').slice(0, 180);
    return '';
}
function download(bytes: BlobPart, name: string, type: string) {
    const url = URL.createObjectURL(new Blob([bytes], { type }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DocumentInspector() {
    const [inspection, setInspection] = useState<Inspection | null>(null);
    const [status, setStatus] = useState('');
    const [busy, setBusy] = useState(false);

    const inspect = async (file: File | null) => {
        setInspection(null); setStatus('');
        if (!file) return;
        if (file.size > MAX_FILE_SIZE) { setStatus('Choose a file up to 25 MB.'); return; }
        setBusy(true);
        try {
            const bytes = new Uint8Array(await file.arrayBuffer());
            const signature = hex(bytes.slice(0, 12)).toUpperCase();
            const isPdf = signature.startsWith('25504446');
            const isImage = file.type.startsWith('image/') || signature.startsWith('FFD8FF') || signature.startsWith('89504E470D0A1A0A');
            const digest = hex(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)));
            const findings: Finding[] = [
                { label: 'File name', value: file.name }, { label: 'File size', value: `${file.size.toLocaleString()} bytes` },
                { label: 'Browser MIME', value: file.type || 'Not provided' }, { label: 'Modified', value: new Date(file.lastModified).toISOString() },
                { label: 'Magic bytes', value: signature || 'Empty file' },
            ];
            let kind: Inspection['kind'] = 'other';
            if (isPdf) {
                kind = 'pdf';
                const { PDFDocument } = await import('pdf-lib');
                try {
                    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
                    findings.push({ label: 'PDF pages', value: String(pdf.getPageCount()) });
                    for (const [label, value] of [['Title', pdf.getTitle()], ['Author', pdf.getAuthor()], ['Subject', pdf.getSubject()], ['Creator', pdf.getCreator()], ['Producer', pdf.getProducer()], ['Keywords', pdf.getKeywords()]] as const) {
                        if (value) findings.push({ label, value: safeValue(value), risk: ['Author', 'Creator', 'Producer'].includes(label) });
                    }
                } catch { findings.push({ label: 'PDF structure', value: 'Encrypted or unsupported document', risk: true }); }
                const source = new TextDecoder('latin1').decode(bytes);
                if (/\/JavaScript|\/JS\b/.test(source)) findings.push({ label: 'Active content', value: 'JavaScript marker detected', risk: true });
                if (/\/EmbeddedFiles?\b/.test(source)) findings.push({ label: 'Attachments', value: 'Embedded file marker detected', risk: true });
                if (/\/AcroForm\b/.test(source)) findings.push({ label: 'Interactive content', value: 'PDF form detected' });
                if (/\/Encrypt\b/.test(source)) findings.push({ label: 'Encryption', value: 'Encrypted PDF structure detected' });
            } else if (isImage) {
                kind = 'image';
                try {
                    const exifr = await import('exifr');
                    const metadata = await exifr.parse(file, { tiff: true, exif: true, gps: true, iptc: true, xmp: true });
                    for (const [key, value] of Object.entries(metadata ?? {}).slice(0, 40)) {
                        const shown = safeValue(value); if (shown) findings.push({ label: key, value: shown, risk: /gps|latitude|longitude|owner|artist|author|serial/i.test(key) });
                    }
                    if (!metadata || !Object.keys(metadata).length) findings.push({ label: 'Image metadata', value: 'No readable EXIF, IPTC or XMP fields found' });
                } catch { findings.push({ label: 'Image metadata', value: 'No readable metadata found' }); }
            } else findings.push({ label: 'Inspection support', value: 'General file information and SHA-256 only' });
            setInspection({ file, kind, findings, sha256: digest, canClean: kind === 'pdf' || kind === 'image' });
        } catch { setStatus('The selected file could not be inspected in this browser.'); }
        finally { setBusy(false); }
    };

    const clean = async () => {
        if (!inspection?.canClean) return;
        setBusy(true); setStatus('Creating a sanitized copy locally...');
        try {
            if (inspection.kind === 'pdf') {
                const { PDFDocument } = await import('pdf-lib');
                const pdf = await PDFDocument.load(await inspection.file.arrayBuffer(), { updateMetadata: false });
                pdf.setTitle(''); pdf.setAuthor(''); pdf.setSubject(''); pdf.setKeywords([]); pdf.setCreator(''); pdf.setProducer('');
                const result = await pdf.save({ useObjectStreams: true });
                download(result as unknown as BlobPart, inspection.file.name.replace(/\.pdf$/i, '') + '-clean.pdf', 'application/pdf');
                setStatus('Clean PDF created. Standard document metadata was cleared; active content and attachments were not modified.');
            } else {
                const image = await createImageBitmap(inspection.file);
                const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
                canvas.getContext('2d', { alpha: true })?.drawImage(image, 0, 0); image.close();
                const type = inspection.file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.94));
                if (!blob) throw new Error('Unable to encode image');
                const extension = type === 'image/png' ? 'png' : 'jpg';
                download(blob, inspection.file.name.replace(/\.[^.]+$/, '') + `-clean.${extension}`, type);
                setStatus('Clean image created without the original EXIF, IPTC or XMP metadata.');
            }
        } catch { setStatus('A sanitized copy could not be created. Encrypted PDFs cannot be cleaned.'); }
        finally { setBusy(false); }
    };

    return <section>
        <label className="grid min-h-48 cursor-pointer place-items-center rounded-2xl border border-dashed border-border bg-foreground/[0.015] p-6 text-center transition hover:border-cyan-500/60"><input type="file" accept=".pdf,image/jpeg,image/png,image/webp,.doc,.docx,.odt,.rtf,.txt" className="sr-only" onChange={(event) => void inspect(event.target.files?.[0] ?? null)} /><span><span className="block text-sm font-bold">Choose a document or image</span><span className="mt-2 block text-xs leading-6 text-muted-foreground">PDF, DOCX, ODT, RTF, TXT, JPEG, PNG or WebP - maximum 25 MB</span></span></label>
        {busy ? <p className="mt-4 text-sm text-muted-foreground">Processing locally...</p> : null}
        {inspection ? <div className="mt-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-cyan-500">Inspection report</p><h2 className="mt-2 text-2xl font-black">{inspection.file.name}</h2></div>{inspection.canClean ? <button type="button" disabled={busy} onClick={() => void clean()} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-foreground px-4 text-xs font-bold text-background disabled:opacity-40"><Download className="size-4" /> Download clean copy</button> : null}</div><div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">{inspection.findings.map((finding, index) => <article key={`${finding.label}-${index}`} className="bg-background p-4"><div className="flex items-start gap-3">{finding.risk ? <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-500" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />}<div><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{finding.label}</p><p className="mt-1 break-all text-xs font-semibold leading-5">{finding.value}</p></div></div></article>)}</div><div className="mt-4 rounded-xl border border-border p-4"><div className="flex gap-3"><ShieldCheck className="size-5 shrink-0 text-cyan-500" /><div><p className="text-xs font-bold">SHA-256</p><p className="mt-2 break-all font-mono text-[11px] leading-5 text-muted-foreground">{inspection.sha256}</p></div></div></div></div> : null}
        {status ? <p className="mt-4 rounded-lg border border-border p-3 text-xs leading-5 text-muted-foreground">{status}</p> : null}
    </section>;
}
