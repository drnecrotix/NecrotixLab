'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import type { Experience } from '@/types';
import type { ExperienceContent } from '@/lib/experience-content';
import { EntryThumbnail } from './EntryThumbnail';
import { journeyPeriod, journeyDate, journeyTimelineGroups } from '@/lib/journey-category';
import { Timeline } from '@/components/ui/timeline';

function logoClasses(logo?: string) {
    const src = logo || '';
    const invertDark = src.includes('McKinsey')
        || src.includes('TelkomUniversity')
        || src.includes('softagelogo')
        || src.includes('dinas-pangan')
        || src.includes('yotlogo')
        || src.includes('youth-ranger')
        || src.includes('aiesec')
        || src.includes('microsot')
        || src.includes('dicoding')
        || src.includes('cisometric');
    const removeWhiteDark = src.includes('logobei') || src.includes('birulangit');
    const invertLight = src.includes('flyrank') || src.includes('FlyRank');

    if (removeWhiteDark) return 'dark:invert dark:hue-rotate-180';
    if (invertDark) return 'dark:invert';
    if (invertLight) return 'invert dark:invert-0';
    return '';
}

export function JourneyTimeline({ content, entries }: { content: ExperienceContent; entries: Experience[] }) {
    // Group adjacent years only so undated entries and manual ordering stay intact.
    const grouped = useMemo(() => journeyTimelineGroups(entries), [entries]);

    const data = grouped.map((group) => ({
        title: group.title,
        content: (
            <div className="space-y-4">
                {group.experiences.map((experience) => (
                    <JourneyTimelineEntry key={experience.id} experience={experience} content={content} />
                ))}
            </div>
        ),
    }));

    if (data.length === 0) {
        return <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">{content.emptyState}</div>;
    }

    return <Timeline data={data} />;
}

function JourneyTimelineEntry({ experience, content }: { experience: Experience; content: ExperienceContent }) {
    const specificLogoClasses = logoClasses(experience.logo);
    const period = journeyPeriod(journeyDate(experience.startDate), experience.endDate ? journeyDate(experience.endDate) : '', experience.isOngoing);

    return (
        <article className="group/timeline relative min-w-0 rounded-2xl border border-border bg-card/50 p-4 sm:p-6 dark:border-neutral-800">
            <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    {experience.logo && <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-background"><Image src={experience.logo} alt="" fill sizes="40px" unoptimized className={`object-contain p-1.5 ${specificLogoClasses}`} /></div>}
                    <div className="min-w-0"><h3 className="break-words text-xl font-bold leading-tight text-neutral-900 dark:text-white">
                        {experience.position}
                    </h3>
                    <p className="break-words text-lg font-medium text-primary">{!/^[-–—]+$/.test(experience.company.trim()) ? experience.company : ''}</p></div>
                </div>
                <div className="flex items-center gap-3"><EntryThumbnail src={experience.thumbnail} label={experience.position} /><div className="flex flex-col gap-2 sm:items-end">
                    {period && <span className="w-fit rounded bg-neutral-100 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                        {period}
                    </span>}
                </div></div>
            </div>

            {experience.description && (
                <p className="mb-6 text-left text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 md:text-base">
                    {experience.description}
                </p>
            )}

            {content.showResponsibilities && experience.responsibilities && experience.responsibilities.length > 0 && (
                <ul className="mb-8 space-y-3">
                    {experience.responsibilities.slice(0, 3).map((responsibility) => (
                        <li key={responsibility} className="flex items-start gap-2.5 text-left text-xs text-neutral-500 dark:text-neutral-400 md:text-sm">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/40" />
                            <span>{responsibility}</span>
                        </li>
                    ))}
                </ul>
            )}

            {content.showSkills && experience.skills.length > 0 && (
                <div className="mb-8 flex flex-wrap gap-2">
                    {experience.skills.map((skill) => (
                        <span
                            key={skill}
                            className="cursor-default rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-200 hover:text-neutral-900 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                        >
                            {skill}
                        </span>
                    ))}
                </div>
            )}
        </article>
    );
}
