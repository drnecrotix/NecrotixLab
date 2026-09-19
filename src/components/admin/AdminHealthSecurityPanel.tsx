'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, ArrowUpRight, CheckCircle2, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CheckStatus, OperationalCheck } from '@/lib/site-health';

type Payload = { status: CheckStatus; securityStatus: CheckStatus; securityScore: number; health: OperationalCheck[]; security: OperationalCheck[]; checkedAt: string };

function tone(status: CheckStatus) {
    if (status === 'ok') return 'border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-600 dark:text-emerald-300';
    if (status === 'warning') return 'border-amber-500/25 bg-amber-500/[0.07] text-amber-700 dark:text-amber-300';
    return 'border-red-500/25 bg-red-500/[0.07] text-red-700 dark:text-red-300';
}

function statusLabel(status: CheckStatus) {
    return status === 'ok' ? 'Healthy' : status === 'warning' ? 'Needs attention' : 'Problem';
}

function StatusIcon({ status }: { status: CheckStatus }) {
    return status === 'ok' ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <AlertTriangle className={cn('size-3.5', status === 'warning' ? 'text-amber-500' : 'text-red-500')} />;
}

function CompactPanel({ title, href, icon, status, checks, metric }: { title: string; href: string; icon: React.ReactNode; status: CheckStatus; checks: OperationalCheck[]; metric?: string }) {
    const problems = checks.filter((entry) => entry.status !== 'ok').length;
    return (
        <section className="group rounded-2xl border border-foreground/10 bg-foreground/[0.025] p-4 transition hover:border-foreground/20 sm:p-5">
            <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><span className="text-muted-foreground">{icon}</span><div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-0.5 text-[9px] text-muted-foreground">{problems ? `${problems} item${problems === 1 ? '' : 's'} need attention` : 'All checked safeguards are healthy'}</p></div></div><span className={cn('rounded-full border px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.08em]', tone(status))}>{statusLabel(status)}</span></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">{checks.slice(0, 3).map((check) => <div key={check.id} className="min-w-0 rounded-xl border border-foreground/10 bg-background/45 px-3 py-2.5"><div className="flex items-center gap-1.5"><StatusIcon status={check.status} /><span className="truncate text-[10px] font-medium">{check.label}</span></div><p className="mt-1 truncate font-mono text-[8px] text-muted-foreground" title={check.summary}>{check.summary}</p></div>)}</div>
            <div className="mt-4 flex items-center justify-between border-t border-foreground/10 pt-3"><span className="font-mono text-[9px] text-muted-foreground">{metric || `${checks.length} live checks`}</span><Link href={href} className="inline-flex items-center gap-1.5 text-[10px] font-semibold transition group-hover:text-emerald-600">Open panel <ArrowUpRight className="size-3" /></Link></div>
        </section>
    );
}

export function AdminHealthSecurityPanel() {
    const [data, setData] = useState<Payload | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/site-health', { cache: 'no-store' });
            const value = await response.json() as Payload & { error?: string };
            if (!response.ok) throw new Error(value.error || `Health request failed (${response.status})`);
            setData(value); setError('');
        } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load operational checks.'); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { void refresh(); }, [refresh]);

    return <div>
        <div className="mb-2 flex items-center justify-between gap-3"><p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Operations</p><button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-1.5 text-[9px] text-muted-foreground hover:text-foreground disabled:opacity-50"><RefreshCw className={cn('size-3', loading && 'animate-spin')} /> Refresh</button></div>
        {error ? <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-600">{error}</div> : null}
        {!data && loading ? <div className="flex items-center justify-center gap-2 rounded-2xl border border-foreground/10 py-14 text-xs text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Running live checks…</div> : null}
        {data ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2"><CompactPanel title="Site Health" href="/admin/site-health" icon={<Activity className="size-4" />} status={data.status} checks={data.health} /><CompactPanel title="Security" href="/admin/security" icon={<ShieldCheck className="size-4" />} status={data.securityStatus} checks={data.security} metric={`${data.securityScore}/100 protection score`} /></div> : null}
    </div>;
}
