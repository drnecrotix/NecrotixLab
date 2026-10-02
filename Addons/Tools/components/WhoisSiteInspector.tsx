'use client';
import { useEffect, useState } from 'react';
type Site = { finalUrl: string; status: number; server: string; poweredBy: string; contentType: string; checkedAt: string; truncated: boolean; note: string; cms: { name: string; confidence: string; evidence: string[] }[]; panels: { path: string; url: string; status: number | null; finding: string }[] };
export function WhoisSiteInspector({ domain }: { domain: string }) {
    const [busy, setBusy] = useState(true), [result, setResult] = useState<Site | null>(null), [error, setError] = useState('');
    useEffect(() => {
        const controller = new AbortController();
        async function inspect() {
        setBusy(true); setError(''); setResult(null);
        try {
            const response = await fetch('/api/tools/whois/site', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Inspection failed');
            if (!controller.signal.aborted) setResult(data);
        } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Inspection failed'); } finally { if (!controller.signal.aborted) setBusy(false); }
    }
        void inspect();
        return () => controller.abort();
    }, [domain]);
    return <section className="space-y-3 border-t border-border pt-5"><h3 className="font-bold">Website technology & login pages</h3><p className="my-3 text-xs text-muted-foreground">Automatically checks public CMS signatures and up to five standard login paths. No credentials are submitted.</p>{busy && <p role="status" className="text-sm text-muted-foreground">Checking website technology and login pages...</p>}{error && <p role="alert" className="mt-3 text-sm text-rose-500">{error}</p>}{result && <div aria-live="polite" className="mt-4 space-y-3 text-sm"><p className="break-all">{result.finalUrl} · HTTP {result.status}</p><p>Server: {result.server}<br />Powered by: {result.poweredBy}<br />Content type: {result.contentType}</p><h4 className="font-semibold">Detected CMS</h4>{result.cms.length ? result.cms.map(cms => <p key={cms.name}><strong>{cms.name}</strong> · {cms.confidence} evidence<br /><span className="text-muted-foreground">{cms.evidence.join(' · ')}</span></p>) : <p>No recognizable CMS signature. This may be a custom site or a CMS with hidden signatures.</p>}{result.panels.map(panel => <div key={panel.path} className="rounded-xl bg-muted/40 p-3"><a href={panel.url} target="_blank" rel="noopener noreferrer" className="break-all underline">{panel.path}</a><p>{panel.finding} · HTTP {panel.status ?? 'No response'}</p></div>)}<p className="text-xs text-muted-foreground">{result.note} {result.truncated && 'HTML was truncated.'} Checked: {result.checkedAt}</p></div>}</section>;
}
