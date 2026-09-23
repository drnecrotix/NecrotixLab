'use client';
import { useEffect, useState, type FormEvent } from 'react';
type Format = { id: string; height: number; width: number; size: number | null; downloadUrl: string };
type Result = { title: string; platform: string; duration: number | null; uploader: string | null; formats: Format[] };
export function VideoDownload() {
    const [url, setUrl] = useState(''), [result, setResult] = useState<Result | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(false), [available, setAvailable] = useState<boolean | null>(null);
    useEffect(() => { fetch('/api/tools/video-download').then((response) => response.json()).then((data) => setAvailable(Boolean(data.available))).catch(() => setAvailable(false)); }, []);
    async function inspect(event: FormEvent) {
        event.preventDefault(); setLoading(true); setError(''); setResult(null);
        try {
            const response = await fetch('/api/tools/video-download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Could not inspect this video.');
            setResult(data);
        } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not inspect this video.'); }
        finally { setLoading(false); }
    }
    return <div className="space-y-6">
        <div className="rounded-2xl border border-border p-5"><p className="text-sm font-bold">Public posts from Facebook, Instagram and X</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Paste a direct video post URL. Private posts, login-only content, DRM, stories requiring an account and playlists are unsupported. Download only material you own or are permitted to save.</p><p className={`mt-3 text-xs ${available ? 'text-emerald-500' : 'text-amber-500'}`}>{available === null ? 'Checking video backend...' : available ? 'Video backend ready' : 'Video backend unavailable - yt-dlp must be installed on this server.'}</p></div>
        <form onSubmit={inspect} className="flex min-w-0 flex-col gap-2 sm:flex-row"><input required type="url" maxLength={2048} value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.instagram.com/reel/..." aria-label="Public video URL" className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-4 text-sm" /><button type="submit" disabled={loading || available !== true} className="rounded-xl bg-foreground px-5 py-3 text-sm font-bold text-background disabled:opacity-50">{loading ? 'Inspecting...' : 'Find video'}</button></form>
        {error && <p role="alert" className="rounded-xl border border-rose-500/40 p-4 text-sm text-rose-500">{error}</p>}
        {result && <section className="min-w-0 rounded-2xl border border-border p-5"><p className="text-xs uppercase tracking-wider text-cyan-500">{result.platform} public video</p><h2 className="mt-2 break-words text-xl font-bold">{result.title}</h2><p className="mt-2 text-xs text-muted-foreground">{[result.uploader, result.duration ? `${Math.floor(result.duration / 60)}:${String(Math.round(result.duration % 60)).padStart(2, '0')}` : null].filter(Boolean).join(' · ')}</p><div className="mt-5 space-y-2">{result.formats.map((format) => <div key={format.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"><div><strong className="text-sm">{format.height ? `${format.height}p` : 'MP4'} · video + audio</strong><p className="text-xs text-muted-foreground">{format.width ? `${format.width} × ${format.height}` : 'Resolution unknown'}{format.size ? ` · ~${(format.size / 1024 / 1024).toFixed(1)} MB` : ''}</p></div><a href={format.downloadUrl} className="rounded-lg bg-foreground px-4 py-2 text-xs font-bold text-background">Download MP4</a></div>)}</div><p className="mt-4 text-xs text-muted-foreground">Links expire after five minutes. Files are streamed through this server up to 250 MB. Source availability can change.</p></section>}
    </div>;
}
