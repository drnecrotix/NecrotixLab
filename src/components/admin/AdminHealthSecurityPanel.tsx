'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, Loader2, RefreshCw, ShieldCheck, Siren } from 'lucide-react';
import { cn } from '@/lib/utils';

type Status = 'ok' | 'warning' | 'error';
type Check = { id: string; label: string; status: Status; summary: string; detail: string };
type Payload = {
    status: Status;
    securityStatus: Status;
    health: Check[];
    security: Check[];
    runtime: { version: string; uptimeSeconds: number; memoryMb: number };
    checkedAt: string;
};

function tone(status: Status) {
    if (status === 'ok') return 'border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-300';
    if (status === 'warning') return 'border-amber-500/25 bg-amber-500/[0.07] text-amber-700 dark:text-amber-300';
    return 'border-red-500/25 bg-red-500/[0.07] text-red-700 dark:text-red-300';
}

function label(status: Status) {
    return status === 'ok' ? 'Healthy' : status === 'warning' ? 'Needs attention' : 'Problem';
}

function StatusIcon({ status }: { status: Status }) {
    if (status === 'ok') return <CheckCircle2 className="size-3.5 text-emerald-500" />;
    return <AlertTriangle className={cn('size-3.5', status === 'warning' ? 'text-amber-500' : 'text-red-500')} />;
}

function CheckCard({ title, icon, status, checks, footer }: { title: string; icon: React.ReactNode; status: Status; checks: Check[]; footer?: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.025] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2"><span className="text-muted-foreground">{icon}</span><h3 className="font-semibold">{title}</h3></div>
                <span className={cn('rounded-full border px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.1em]', tone(status))}>{label(status)}</span>
            </div>
            <div className="mt-4 space-y-2">
                {checks.slice(0, 3).map((check) => <div key={check.id} className="flex items-center justify-between gap-3 text-xs"><span className="inline-flex min-w-0 items-center gap-2 text-muted-foreground"><StatusIcon status={check.status} /><span className="truncate">{check.label}</span></span><span className="shrink-0 font-mono text-[10px]">{check.summary}</span></div>)}
            </div>
            <details className="group mt-4 border-t border-foreground/10 pt-3">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[10px] font-medium text-muted-foreground transition hover:text-foreground">More details <ChevronDown className="size-3.5 transition group-open:rotate-180" /></summary>
                <div className="mt-3 space-y-2">
                    {checks.map((check) => <div key={check.id} className="rounded-xl border border-foreground/10 bg-background/45 px-3 py-2.5"><div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-xs font-medium"><StatusIcon status={check.status} />{check.label}</span><span className="font-mono text-[9px] text-muted-foreground">{check.summary}</span></div><p className="mt-1.5 text-[10px] leading-4 text-muted-foreground">{check.detail}</p></div>)}
                    {footer}
                </div>
            </details>
        </div>
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
            setData(value);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load health checks.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void refresh(); }, [refresh]);

    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Operations</p>
                <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-1.5 text-[9px] text-muted-foreground hover:text-foreground disabled:opacity-50"><RefreshCw className={cn('size-3', loading && 'animate-spin')} /> Refresh</button>
            </div>
            {error ? <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-600">{error}</div> : null}
            {!data && loading ? <div className="flex items-center justify-center gap-2 rounded-2xl border border-foreground/10 py-14 text-xs text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Running live checks…</div> : null}
            {data ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <CheckCard title="Site health" icon={<Siren className="size-4" />} status={data.status} checks={data.health} footer={<p className="px-1 text-[9px] leading-4 text-muted-foreground">Runtime v{data.runtime.version} · uptime {Math.floor(data.runtime.uptimeSeconds / 60)} min · memory {data.runtime.memoryMb} MB</p>} />
                <CheckCard title="Security" icon={<ShieldCheck className="size-4" />} status={data.securityStatus} checks={data.security} footer={<p className="px-1 text-[9px] leading-4 text-muted-foreground">These are operational safeguards, not a visitor threat score. Normal browsing behavior is not labelled malicious.</p>} />
            </div> : null}
        </div>
    );
}
