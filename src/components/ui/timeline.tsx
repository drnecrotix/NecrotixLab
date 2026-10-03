import type { ReactNode } from 'react';

interface TimelineEntry {
    title: string;
    content: ReactNode;
}

export function Timeline({ data }: { data: TimelineEntry[]; isLowPowerMode?: boolean }) {
    return (
        <div className="relative min-w-0 py-2">
            <div aria-hidden="true" className="absolute bottom-8 left-2 top-6 w-px bg-border sm:left-[7.5rem]" />
            <div className="space-y-8 sm:space-y-10">
                {data.map((item, index) => (
                    <section key={`${item.title}-${index}`} className="relative grid min-w-0 gap-3 pl-7 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-8 sm:pl-0" aria-label={item.title}>
                        <span aria-hidden="true" className="absolute left-[3px] top-3 size-[11px] rounded-full border-2 border-background bg-primary ring-4 ring-background sm:left-[calc(7.5rem-5px)]" />
                        <h3 className="w-fit max-w-full self-start break-words rounded-lg border border-border/60 bg-card px-3 py-1.5 text-sm font-semibold tabular-nums text-foreground sm:sticky sm:top-28 sm:text-right">
                            {item.title}
                        </h3>
                        <div className="min-w-0 sm:pl-2">{item.content}</div>
                    </section>
                ))}
            </div>
        </div>
    );
}
