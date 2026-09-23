'use client';
import { useState } from 'react';

type Field = { key: string; value: string; sensitive: boolean };
function display(value: unknown): string {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value).slice(0, 500);
    if (Array.isArray(value)) return value.slice(0, 16).map(display).filter(Boolean).join(', ').slice(0, 500);
    if (value && typeof value === 'object' && !(value instanceof Uint8Array)) return JSON.stringify(value).slice(0, 500);
    return '';
}
function download(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob), anchor = document.createElement('a');
    anchor.href = url; anchor.download = name; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ExifTool() {
    const [file, setFile] = useState<File | null>(null), [fields, setFields] = useState<Field[]>([]), [error, setError] = useState(''), [status, setStatus] = useState(''), [busy, setBusy] = useState(false);
    async function inspect(next: File | null) {
        setFile(null); setFields([]); setError(''); setStatus('');
        if (!next) return;
        if (next.size > 25 * 1024 * 1024) { setError('Choose an image up to 25 MB.'); return; }
        if (!/\.(jpe?g|png|webp|heic|heif|tiff?)$/i.test(next.name) && !/^image\/(jpeg|png|webp|heic|heif|tiff)$/.test(next.type)) { setError('Choose a JPEG, PNG, WebP, HEIC or TIFF image.'); return; }
        setBusy(true);
        try {
            const exifr = await import('exifr');
            const data = await exifr.parse(next, { tiff: true, exif: true, gps: true, iptc: true, xmp: true, icc: true });
            const rows = Object.entries(data || {}).slice(0, 250).map(([key, value]) => ({ key, value: display(value), sensitive: /gps|latitude|longitude|location|owner|artist|author|serial|camera|device|date|time|software/i.test(key) })).filter((row) => row.value);
            setFile(next); setFields(rows);
            if (!rows.length) setStatus('No readable EXIF, GPS, IPTC or XMP fields found.');
        } catch { setError('Could not read metadata from this image. The format may be unsupported or the file may be damaged.'); }
        finally { setBusy(false); }
    }
    async function clean() {
        if (!file) return;
        setBusy(true); setError(''); setStatus('');
        try {
            const bitmap = await createImageBitmap(file);
            if (bitmap.width * bitmap.height > 40_000_000) { bitmap.close(); throw new Error('Image exceeds the 40 megapixel cleaning limit.'); }
            const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
            const context = canvas.getContext('2d');
            if (!context) { bitmap.close(); throw new Error('Canvas is unavailable in this browser.'); }
            context.drawImage(bitmap, 0, 0); bitmap.close();
            const type = file.type === 'image/png' ? 'image/png' : file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
            const result = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.94));
            canvas.width = canvas.height = 0;
            if (!result) throw new Error('Could not encode the clean image.');
            download(result, `${file.name.replace(/\.[^.]+$/, '')}-clean.${type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'}`);
            setStatus('Clean copy downloaded. Re-encoding removes embedded metadata and may change quality or animation.');
        } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not create a clean copy.'); }
        finally { setBusy(false); }
    }
    return <div className="space-y-5">
        <label className="grid min-h-40 cursor-pointer place-items-center rounded-xl border border-dashed border-border p-6 text-center hover:border-cyan-500"><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/tiff,.jpg,.jpeg,.png,.webp,.heic,.heif,.tif,.tiff" className="sr-only" onChange={(event) => void inspect(event.target.files?.[0] || null)} /><span><strong className="block">Choose an image</strong><span className="mt-2 block text-xs text-muted-foreground">JPEG, PNG, WebP, HEIC or TIFF - up to 25 MB. The file stays in your browser.</span></span></label>
        {busy && <p className="text-sm text-muted-foreground">Processing image...</p>}
        {error && <p role="alert" className="rounded-xl border border-rose-500/40 p-4 text-sm text-rose-500">{error}</p>}
        {status && <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">{status}</p>}
        {file && <><div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-5"><div><h2 className="break-all font-bold">{file.name}</h2><p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB · {fields.length} readable fields · {fields.filter((field) => field.sensitive).length} privacy signals</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => download(new Blob([JSON.stringify(Object.fromEntries(fields.map(({ key, value }) => [key, value])), null, 2)], { type: 'application/json' }), `${file.name}-metadata.json`)} className="rounded-lg border border-border px-4 py-2 text-xs font-bold">Export JSON</button>{/\.(jpe?g|png|webp)$/i.test(file.name) && <button type="button" disabled={busy} onClick={() => void clean()} className="rounded-lg bg-foreground px-4 py-2 text-xs font-bold text-background disabled:opacity-50">Download without metadata</button>}</div></div><div className="grid gap-3 sm:grid-cols-2">{fields.map((field) => <div key={field.key} className={`min-w-0 rounded-xl border p-4 ${field.sensitive ? 'border-amber-500/40' : 'border-border'}`}><p className="text-xs font-bold">{field.key}{field.sensitive ? ' · privacy' : ''}</p><p className="mt-2 break-all text-sm text-muted-foreground">{field.value}</p></div>)}</div><p className="text-xs leading-5 text-muted-foreground">A clean copy is re-encoded and may change visual quality, color profile, or animation. HEIC and TIFF files can be inspected but require conversion elsewhere before cleaning.</p></>}
    </div>;
}
