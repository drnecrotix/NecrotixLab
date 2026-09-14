import { Archive, CheckCircle2, CircleDashed, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PROJECT_STATUS_DETAILS, type ProjectStatus } from '@/lib/project-status';

const presentation = {
    planned: {
        icon: CircleDashed,
        className: 'border-slate-400/30 bg-slate-400/[0.08] text-slate-600 dark:text-slate-200',
        heroClassName: 'shadow-[0_0_24px_rgba(148,163,184,0.09)]',
        iconClassName: 'motion-safe:animate-[spin_8s_linear_infinite]',
    },
    ongoing: {
        icon: Loader2,
        className: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-200',
        heroClassName: 'shadow-[0_0_24px_rgba(14,165,233,0.12)]',
        iconClassName: 'motion-safe:animate-[spin_3s_linear_infinite]',
    },
    completed: {
        icon: CheckCircle2,
        className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
        heroClassName: 'shadow-[0_0_24px_rgba(16,185,129,0.12)]',
        iconClassName: 'motion-safe:animate-[pulse_3.5s_ease-in-out_infinite]',
    },
    archived: {
        icon: Archive,
        className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200',
        heroClassName: 'shadow-[0_0_24px_rgba(245,158,11,0.1)]',
        iconClassName: '',
    },
} as const;

export function ProjectStatusBadge({ status, className, variant = 'compact' }: { status: ProjectStatus; className?: string; variant?: 'compact' | 'hero' }) {
    const { label, description } = PROJECT_STATUS_DETAILS[status];
    const { icon: Icon, className: tone, heroClassName, iconClassName } = presentation[status];

    return <span
        title={description}
        aria-label={`${label}: ${description}`}
        className={cn(
            'inline-flex shrink-0 items-center rounded-full border font-semibold uppercase transition-[border-color,background-color,box-shadow] duration-300 motion-reduce:transition-none',
            variant === 'hero'
                ? 'min-h-10 gap-2 px-3.5 py-2 text-[11px] tracking-[0.12em] sm:text-xs'
                : 'min-h-7 gap-1.5 px-2.5 py-1 text-[10px] tracking-[0.08em] sm:text-xs',
            tone,
            variant === 'hero' && heroClassName,
            className,
        )}
    >
        <Icon aria-hidden="true" className={cn(variant === 'hero' ? 'size-4' : 'size-3.5', iconClassName, 'motion-reduce:animate-none')} />
        {label}
    </span>;
}
