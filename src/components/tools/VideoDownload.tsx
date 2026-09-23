'use client';
import { useEffect, useState, type FormEvent } from 'react';
type Format = { id: string; height: number; width: number; size: number | null; downloadUrl: string };
type Result = { title: string; platform: string; duration: number | null; uploader: string | null; formats: Format[] };
function validXPostUrl(input: string) {
    try {
        const url = new URL(input);
        if (url.protocol !== 'https:' || !['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(url.hostname)) return null;
        const match = url.pathname.match(/^\/([a-zA-Z0-9_]{1,15})\/status\/(\d{1,20})\/?$/);
        return match ? url.toString() : null;
    } catch { return null; }
}
export function VideoDownload() {
    const [backendReason, setBackendReason] = useState(''), [url, setUrl] = useState(''), [result, setResult] = useState<Result | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(false), [available, setAvailable] = useState<boolean | null>(null), [copied, setCopied] = useState(false);
    useEffect(() => { fetch('/api/tools/video-download').then((response) => response.json()).then((data) => { setAvailable(Boolean(data.available)); setBackendReason(data.reason || ''); }).catch(() => setAvailable(false)); }, []);
    async function inspect(event: FormEvent) {
        event.preventDefault(); setLoading(true); setError(''); setResult(null); setCopied(false);
        try {
            const response = await fetch('/api/tools/video-download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Could not inspect this video.');
            setResult(data);
        } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not inspect this video.'); }
        finally { setLoading(false); }
    }
    return <div className="space-y-6">
        <div className="rounded-2xl border border-border p-5"><p className="text-sm font-bold">Public X.com video posts</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Paste a direct X post URL. Private or login-only posts are unsupported. Download only material you own or are permitted to save. This uses the public X embed feed and does not run yt-dlp.</p><p className={`mt-3 text-xs ${available ? 'text-emerald-500' : 'text-amber-500'}`}>{available === null ? 'Checking video service...' : available ? 'X video service ready' : backendReason ? `Video service unavailable - ${backendReason}` : 'Video service unavailable.'}</p></div>
        <form onSubmit={inspect} className="flex min-w-0 flex-col gap-2 sm:flex-row"><input required type="url" maxLength={2048} value={url} onChange={(event) => { setUrl(event.target.value); setCopied(false); }} placeholder="https://x.com/user/status/123456789..." aria-label="Public X post URL" className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-4 text-sm" /><button type="submit" disabled={loading || available !== true} className="rounded-xl bg-foreground px-5 py-3 text-sm font-bold text-background disabled:opacity-50">{loading ? 'Inspecting...' : 'Find video'}</button></form>
        {error && <p role="alert" className="rounded-xl border border-rose-500/40 p-4 text-sm text-rose-500">{error}</p>}
        {(error || available === false) && validXPostUrl(url) && <section className="rounded-xl border border-border p-4"><p className="text-sm font-semibold">Alternative download</p><p className="mt-1 text-xs text-muted-foreground">The embedded X Downloader widget did not load reliably. Copy the post URL, then paste it into their website. Your link is not sent to them until you choose to paste it there.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void navigator.clipboard.writeText(validXPostUrl(url)!).then(() => setCopied(true)).catch(() => setError('Could not copy the link. Select it from the field above.'))} className="rounded-lg border border-border px-4 py-2 text-sm">{copied ? 'Copied' : 'Copy post URL'}</button><a href="https://x-downloader.com/en/" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border px-4 py-2 text-sm">Open X Downloader</a></div></section>}
        {result && <section className="min-w-0 rounded-2xl border border-border p-5"><p className="text-xs uppercase tracking-wider text-cyan-500">{result.platform} public video</p><h2 className="mt-2 break-words text-xl font-bold">{result.title}</h2><p className="mt-2 text-xs text-muted-foreground">{[result.uploader, result.duration ? `${Math.floor(result.duration / 60)}:${String(Math.round(result.duration % 60)).padStart(2, '0')}` : null].filter(Boolean).join(' · ')}</p><div className="mt-5 space-y-2">{result.formats.map((format) => <div key={format.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"><div><strong className="text-sm">{format.height ? `${format.height}p` : 'MP4'} · video + audio</strong><p className="text-xs text-muted-foreground">{format.width ? `${format.width} × ${format.height}` : 'Resolution unknown'}{format.size ? ` · ~${(format.size / 1024 / 1024).toFixed(1)} MB` : ''}</p></div><a href={format.downloadUrl} className="rounded-lg bg-foreground px-4 py-2 text-xs font-bold text-background">Download MP4</a></div>)}</div><p className="mt-4 text-xs text-muted-foreground">Links expire after five minutes. Files are streamed through this server up to 250 MB. Source availability can change.</p></section>}
    </div>;
}
