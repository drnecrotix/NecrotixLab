'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, ArrowUpRight, CheckCircle2, ChevronDown, Database, ExternalLink, FileClock, Gauge, KeyRound, Loader2, RefreshCw, ShieldCheck, Sparkles, Trash2, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CheckStatus, OperationalCheck } from '@/lib/site-health';

type Payload = {
    status: CheckStatus;
    securityStatus: CheckStatus;
    securityScore: number;
    health: OperationalCheck[];
    security: OperationalCheck[];
    runtime: { version: string; uptimeSeconds: number; memoryMb: number; node: string };
    logRetentionDays: number;
    checkedAt: string;
};

type LogItem = { id: string; source: string; checkId: string; severity: string; title: string; message: string; details: unknown; createdAt: string };

function tone(status: CheckStatus) {
    if (status === 'ok') return 'border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-600 dark:text-emerald-300';
    if (status === 'warning') return 'border-amber-500/25 bg-amber-500/[0.07] text-amber-700 dark:text-amber-300';
    return 'border-red-500/25 bg-red-500/[0.07] text-red-700 dark:text-red-300';
}

function StatusIcon({ status, className }: { status: CheckStatus; className?: string }) {
    if (status === 'ok') return <CheckCircle2 className={cn('size-4 text-emerald-500', className)} />;
    return <AlertTriangle className={cn('size-4', status === 'warning' ? 'text-amber-500' : 'text-red-500', className)} />;
}

function CheckCard({ check }: { check: OperationalCheck }) {
    return (
        <article className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="text-[8px] uppercase tracking-[0.16em] text-muted-foreground">{check.category}</p><h3 className="mt-1.5 flex items-center gap-2 text-sm font-semibold"><StatusIcon status={check.status} />{check.label}</h3></div>
                <span className={cn('max-w-[48%] truncate rounded-full border px-2 py-1 font-mono text-[8px]', tone(check.status))} title={check.summary}>{check.summary}</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{check.detail}</p>
            <details className="group mt-4 border-t border-foreground/10 pt-3">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[10px] font-medium text-muted-foreground hover:text-foreground"><span className="inline-flex items-center gap-1.5"><Wrench className="size-3" /> Resolution guide</span><ChevronDown className="size-3.5 transition group-open:rotate-180" /></summary>
                <div className="mt-3 rounded-xl border border-foreground/10 bg-background/45 p-3">
                    <p className="text-[10px] leading-4 text-muted-foreground"><strong className="text-foreground">Impact:</strong> {check.impact}</p>
                    <ol className="mt-2 space-y-1.5 text-[10px] leading-4 text-muted-foreground">{check.resolution.map((step, index) => <li key={step} className="flex gap-2"><span className="font-mono text-foreground/45">{index + 1}.</span><span>{step}</span></li>)}</ol>
                    {check.actionHref ? <Link href={check.actionHref} className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-medium text-foreground underline decoration-dotted underline-offset-4">{check.actionLabel || 'Open related tool'} <ArrowUpRight className="size-3" /></Link> : null}
                </div>
            </details>
        </article>
    );
}

const quickLinks = [
    { label: 'Service monitoring', href: '/admin/service-monitoring', icon: Activity },
    { label: 'Site mode', href: '/admin/site-mode', icon: Gauge },
    { label: 'API integrations', href: '/admin/api-integrations', icon: KeyRound },
    { label: 'Media storage', href: '/admin/media', icon: Database },
];

export function AdminOperationsWorkbench({ mode }: { mode: 'health' | 'security' }) {
    const [data, setData] = useState<Payload | null>(null);
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);
    const [error, setError] = useState('');
    const [category, setCategory] = useState('All');
    const [logFilter, setLogFilter] = useState('all');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const requests: Promise<Response>[] = [fetch('/api/admin/site-health', { cache: 'no-store' })];
            if (mode === 'health') requests.push(fetch('/api/admin/site-health/logs', { cache: 'no-store' }));
            const [healthResponse, logsResponse] = await Promise.all(requests);
            const healthValue = await healthResponse.json() as Payload & { error?: string };
            if (!healthResponse.ok) throw new Error(healthValue.error || `Analysis failed (${healthResponse.status})`);
            setData(healthValue);
            if (logsResponse) {
                const logValue = await logsResponse.json() as { items?: LogItem[]; error?: string };
                if (!logsResponse.ok) throw new Error(logValue.error || 'Could not load the error log.');
                setLogs(logValue.items || []);
            }
            setError('');
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Could not run the analysis.');
        } finally { setLoading(false); }
    }, [mode]);

    useEffect(() => { void load(); }, [load]);

    const checks = mode === 'health' ? data?.health || [] : data?.security || [];
    const categories = useMemo(() => ['All', ...new Set(checks.map((entry) => entry.category))], [checks]);
    const visibleChecks = category === 'All' ? checks : checks.filter((entry) => entry.category === category);
    const visibleLogs = logs.filter((entry) => logFilter === 'all' || entry.severity === logFilter);
    const currentStatus = mode === 'health' ? data?.status : data?.securityStatus;
    const problems = checks.filter((entry) => entry.status !== 'ok').length;

    const clearLogs = async () => {
        if (!window.confirm('Clear all Site Health and Security log entries? This cannot be undone.')) return;
        setClearing(true);
        try {
            const response = await fetch('/api/admin/site-health/logs', { method: 'DELETE' });
            if (!response.ok) throw new Error('Could not clear the log.');
            setLogs([]);
        } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not clear the log.'); }
        finally { setClearing(false); }
    };

    return (
        <div className="mx-auto max-w-[1500px] space-y-5">
            <header className="flex flex-col gap-4 border-b border-foreground/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div><p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Tools · Operations</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{mode === 'health' ? 'Site Health' : 'Security Center'}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{mode === 'health' ? 'Live service checks, seven-day issue history and practical steps for resolving operational problems.' : 'Layered analysis of transport, browser, authentication and privacy safeguards with clear remediation guidance.'}</p></div>
                <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-foreground/10 bg-foreground/[0.04] px-4 text-xs font-semibold transition hover:bg-foreground/[0.08] disabled:opacity-50"><RefreshCw className={cn('size-4', loading && 'animate-spin')} /> Run analysis</button>
            </header>

            {error ? <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-xs text-red-600 dark:text-red-300">{error}</div> : null}

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.025] p-4"><p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Current state</p><div className="mt-3 flex items-center justify-between"><span className="text-xl font-semibold capitalize">{currentStatus || 'Checking'}</span>{currentStatus ? <StatusIcon status={currentStatus} className="size-5" /> : <Loader2 className="size-5 animate-spin text-muted-foreground" />}</div></div>
                <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.025] p-4"><p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Checks</p><p className="mt-3 text-xl font-semibold tabular-nums">{checks.length}</p><p className="mt-1 text-[9px] text-muted-foreground">{problems} need attention</p></div>
                {mode === 'security' ? <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.025] p-4"><p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Protection score</p><p className="mt-3 text-xl font-semibold tabular-nums">{data?.securityScore ?? 0}/100</p><div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/10"><div className="h-full bg-emerald-500" style={{ width: `${data?.securityScore ?? 0}%` }} /></div></div> : <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.025] p-4"><p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Issue history</p><p className="mt-3 text-xl font-semibold tabular-nums">{logs.length}</p><p className="mt-1 text-[9px] text-muted-foreground">retained for {data?.logRetentionDays ?? 7} days</p></div>}
                <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.025] p-4"><p className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Last analysis</p><p className="mt-3 text-sm font-semibold">{data?.checkedAt ? new Date(data.checkedAt).toLocaleTimeString() : 'Waiting'}</p><p className="mt-1 text-[9px] text-muted-foreground">v{data?.runtime.version || '...'}</p></div>
            </section>

            <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.018] p-4"><div className="flex flex-wrap items-center gap-2"><span className="mr-1 inline-flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground"><Sparkles className="size-3" /> Quick links</span>{quickLinks.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/10 bg-background/60 px-3 py-2 text-[10px] font-medium transition hover:bg-foreground/[0.06]"><Icon className="size-3.5 text-muted-foreground" />{label}</Link>)}</div></section>

            <section>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Analysis</p><h2 className="mt-1 text-lg font-semibold">{mode === 'health' ? 'Operational checks' : 'Protection layers'}</h2></div><div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-foreground/10 bg-background/60 p-0.5">{categories.map((value) => <button key={value} type="button" onClick={() => setCategory(value)} className={cn('shrink-0 rounded-md px-2.5 py-1.5 text-[9px] font-medium', category === value ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}>{value}</button>)}</div></div>
                <div className="grid gap-3 lg:grid-cols-2">{visibleChecks.map((entry) => <CheckCard key={entry.id} check={entry} />)}</div>
            </section>

            {mode === 'health' ? <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.018] p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Error log</p><h2 className="mt-1 text-lg font-semibold">Last {data?.logRetentionDays ?? 7} days</h2><p className="mt-1 text-[10px] text-muted-foreground">Repeated identical issues are grouped for 15 minutes to avoid log noise.</p></div><button type="button" onClick={() => void clearLogs()} disabled={clearing || !logs.length} className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-[10px] font-medium text-red-600 transition hover:bg-red-500/[0.06] disabled:opacity-40"><Trash2 className="size-3.5" /> Clear log</button></div>
                <div className="mt-4 flex gap-1">{['all', 'error', 'warning'].map((value) => <button key={value} onClick={() => setLogFilter(value)} className={cn('rounded-md px-2.5 py-1.5 text-[9px] font-medium capitalize', logFilter === value ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}>{value}</button>)}</div>
                <div className="mt-3 overflow-hidden rounded-xl border border-foreground/10">{visibleLogs.length ? visibleLogs.map((entry) => <div key={entry.id} className="grid gap-2 border-t border-foreground/[0.08] px-3 py-3 first:border-t-0 sm:grid-cols-[120px_90px_minmax(0,1fr)]"><span className="font-mono text-[9px] text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</span><span className={cn('w-fit rounded-full border px-2 py-0.5 text-[8px] font-semibold uppercase', tone(entry.severity as CheckStatus))}>{entry.severity}</span><div className="min-w-0"><p className="text-xs font-medium">{entry.title}</p><p className="mt-1 break-words text-[10px] leading-4 text-muted-foreground">{entry.message}</p></div></div>) : <div className="py-12 text-center"><FileClock className="mx-auto size-5 text-muted-foreground" /><p className="mt-2 text-xs font-medium">No matching issues</p><p className="mt-1 text-[10px] text-muted-foreground">New warnings and errors will appear here automatically.</p></div>}</div>
            </section> : <section className="rounded-2xl border border-foreground/10 bg-foreground/[0.018] p-4 sm:p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 text-emerald-500" /><div><h2 className="text-sm font-semibold">Analysis boundaries</h2><p className="mt-1 text-[10px] leading-5 text-muted-foreground">This panel verifies configured safeguards and current operational signals. It does not label normal visitors as attackers and does not replace edge DDoS protection, a WAF or dependency scanning in CI.</p><a href="https://github.com/drnecrotix/Portfolio/actions" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-medium underline decoration-dotted underline-offset-4">Open GitHub security and CI results <ExternalLink className="size-3" /></a></div></div></section>}
        </div>
    );
}
