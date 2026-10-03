type Category = { id: string; prefix: string };

// Explicit assignment wins; legacy IDs remain supported without being renamed.
export function journeyCategoryId(entry: { id: string; categoryId?: string }, categories: Category[]) {
    if (entry.categoryId) return entry.categoryId;
    return categories.find((category) => category.prefix && entry.id.startsWith(category.prefix))?.id
        ?? categories.find((category) => category.id === 'professional')?.id
        ?? categories[0]?.id;
}

export function journeyPeriod(start?: string, end?: string, ongoing = false) {
    if (ongoing) return start ? `${start} - Present` : 'Present';
    if (start && end) return `${start} - ${end}`;
    return start || end || '';
}

export function journeyDate(value: string) {
    const clean = value.trim();
    if (!clean || /^\d{4}$/.test(clean)) return clean;
    const date = new Date(clean);
    return Number.isFinite(date.getTime()) ? date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : clean;
}

export function journeyThumbnail(value: unknown) {
    if (typeof value !== 'string') return undefined;
    const clean = value.trim().slice(0, 2048);
    if (clean.startsWith('/') && !clean.startsWith('//') && !clean.includes('\\')) return clean;
    try {
        const parsed = new URL(clean);
        if (['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password) return parsed.toString();
    } catch {}
    return undefined;
}

export function journeyTimelineGroups<T extends { startDate: string; endDate?: string }>(entries: T[]) {
    const groups: { title: string; experiences: T[] }[] = [];
    for (const entry of entries) {
        const date = entry.startDate || entry.endDate || '';
        const title = date.match(/\d{4}/)?.[0] ?? 'Undated';
        const previous = groups[groups.length - 1];
        if (previous?.title === title) previous.experiences.push(entry);
        else groups.push({ title, experiences: [entry] });
    }
    return groups;
}
