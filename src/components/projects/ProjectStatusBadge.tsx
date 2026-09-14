import { Archive, CheckCircle2, CircleDashed, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PROJECT_STATUS_DETAILS, type ProjectStatus } from '@/lib/project-status';

const presentation = {
    planned: { icon: CircleDashed, className: 'border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300' },
    ongoing: { icon: Loader2, className: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300' },
    completed: { icon: CheckCircle2, className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
    archived: { icon: Archive, className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300' },
} as const;

export function ProjectStatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
    const { label, description } = PROJECT_STATUS_DETAILS[status];
    const { icon: Icon, className: tone } = presentation[status];

    return <span title={description} className={cn('inline-flex min-h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] sm:text-xs', tone, className)}>
        <Icon aria-hidden="true" className={cn('size-3.5', status === 'ongoing' && 'animate-spin [animation-duration:3s]')} />
        {label}
    </span>;
}
