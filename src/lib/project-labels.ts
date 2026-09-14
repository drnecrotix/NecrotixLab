function labelKey(value: string) {
    return value.trim().toLocaleLowerCase();
}

export function uniqueProjectLabels(...groups: ReadonlyArray<readonly string[]>) {
    const seen = new Set<string>();
    const labels: string[] = [];

    for (const value of groups.flat()) {
        const label = value.trim();
        const key = labelKey(label);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        labels.push(label);
    }

    return labels;
}

export function withoutProjectLabelDuplicates(values: readonly string[], existing: readonly string[]) {
    const existingKeys = new Set(existing.map(labelKey));
    return uniqueProjectLabels(values).filter((value) => !existingKeys.has(labelKey(value)));
}
