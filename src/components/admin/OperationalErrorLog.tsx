'use client';
import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, Search, Trash2 } from 'lucide-react';

export type OperationalLogItem = { id: string; source: string; checkId: string; severity: string; title: string; message: string; details: unknown; createdAt: string; lastSeenAt?: string; occurrences?: number };

export function OperationalErrorLog({ logs, clearing, onClear }: { logs: OperationalLogItem[]; clearing: boolean; onClear: () => void }) {
    const [source, setSource] = useState('all');
    const [severity, setSeverity] = useState('all');
    const [query, setQuery] = useState('');
    const visible = useMemo(() => logs.filter((row) => (source === 'all' || row.source === source) && (severity === 'all' || row.severity === severity) && `${row.title} ${row.message} ${row.source}`.toLowerCase().includes(query.toLowerCase())), [logs, query, severity, source]);
    const counts = logs.reduce((sum, row) => sum + (row.occurrences || 1), 0);
    const runtime = logs.filter((row) => ['browser', 'server', 'media'].includes(row.source));
    return <section className="overflow-hidden rounded-2xl border border-foreground/10 bg-background">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-foreground/10 p-5">
            <div><p className="text-xs font-medium text-muted-foreground">Diagnostics / Last 7 days</p><h2 className="mt-1 text-xl font-semibold">Error log</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">Runtime failures and visitor-reported problems, separated from health checks. Identical events are grouped into 15-minute windows.</p></div>
            <button type="button" disabled={clearing || !logs.length} onClick={onClear} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-500/20 px-3 text-xs text-red-500 disabled:opacity-40"><Trash2 className="size-4" />{clearing ? 'Clearing...' : 'Clear log'}</button>
        </div>
        <div className="grid grid-cols-3 divide-x divide-foreground/10 border-b border-foreground/10 bg-foreground/[0.02]">
            {[['Events', counts], ['Runtime groups', runtime.length], ['Check groups', logs.length - runtime.length]].map(([label, value]) => <div key={label} className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p></div>)}
        </div>
        <div className="flex flex-wrap gap-3 p-4">
            <label className="flex min-w-48 flex-1 items-center gap-2 rounded-lg border border-foreground/15 px-3"><Search className="size-4 text-muted-foreground" /><span className="sr-only">Search error log</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search issue or route..." className="min-h-10 w-full bg-transparent text-sm outline-none" /></label>
            <select aria-label="Error source" value={source} onChange={(e) => setSource(e.target.value)} className="min-h-10 rounded-lg border border-foreground/15 bg-background px-3 text-xs">{['all', 'browser', 'server', 'media', 'health', 'security'].map((value) => <option key={value} value={value}>{value === 'all' ? 'All sources' : value}</option>)}</select>
            <select aria-label="Error severity" value={severity} onChange={(e) => setSeverity(e.target.value)} className="min-h-10 rounded-lg border border-foreground/15 bg-background px-3 text-xs">{['all', 'error', 'warning'].map((value) => <option key={value} value={value}>{value === 'all' ? 'All severities' : value}</option>)}</select>
        </div>
        <div className="border-t border-foreground/10">{visible.map((row) => {
            const detail = row.details && typeof row.details === 'object' ? row.details as Record<string, unknown> : {};
            const steps = Array.isArray(detail.resolution) ? detail.resolution.filter((v): v is string => typeof v === 'string') : [row.source === 'media' ? 'Check that the file exists in Media and storage is reachable. Retry the same image after correcting the storage or processing failure.' : row.source === 'browser' ? 'Reproduce this route in a clean browser. Check the browser Network and Console panels. Browser reports are unverified observations, not proof of a server outage.' : 'Match the error code and time with hosting logs. Check the latest release, database and integrations, then reproduce the route.'];
            return <details key={row.id} className="group border-b border-foreground/10 last:border-b-0">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4 hover:bg-foreground/[0.025]">
                    <AlertTriangle className={`size-4 shrink-0 ${row.severity === 'error' ? 'text-red-500' : 'text-amber-500'}`} />
                    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium">{row.title}</span><span className="rounded border border-foreground/15 px-1.5 py-0.5 text-[10px] text-muted-foreground">{row.source}</span></div><p className="mt-1 truncate text-xs text-muted-foreground">{row.message}</p></div>
                    <div className="shrink-0 text-right"><p className="text-xs font-semibold tabular-nums">{row.occurrences || 1}×</p><time className="text-[10px] text-muted-foreground">{new Date(row.lastSeenAt || row.createdAt).toLocaleString()}</time></div><ChevronDown className="size-4 shrink-0 transition group-open:rotate-180" />
                </summary>
                <div className="grid gap-4 bg-foreground/[0.025] px-5 py-4 md:grid-cols-2"><div className="space-y-2 text-xs leading-5"><p className="font-medium">Diagnostic context</p><p className="break-words text-muted-foreground">{row.message}</p>{typeof detail.resource === 'string' && detail.resource ? <p className="break-words">Resource: <code>{detail.resource}</code></p> : null}<p className="text-muted-foreground">First seen: {new Date(row.createdAt).toLocaleString()}</p><p className="text-muted-foreground">{row.source === 'browser' ? 'Reported by a browser; may reflect a local connection or extension issue.' : 'Observed by the application.'}</p></div><div><p className="text-xs font-medium">Investigate and resolve</p><ol className="mt-2 list-decimal space-y-2 pl-4 text-xs leading-5 text-muted-foreground">{steps.map((step) => <li key={step}>{step}</li>)}</ol></div></div>
            </details>;
        })}{!visible.length ? <div className="p-10 text-center"><p className="text-sm font-medium">No matching recorded issues</p><p className="mt-2 text-xs text-muted-foreground">An empty log does not prove that every visit was error-free. Blocked telemetry and offline browsers cannot report.</p></div> : null}</div>
        <p className="p-4 text-xs leading-5 text-muted-foreground">Showing up to 500 recent groups. Entries expire after 7 days and are removed during log reads or incoming events. No form values, cookies, raw IP addresses or query strings are stored.</p>
    </section>;
}
