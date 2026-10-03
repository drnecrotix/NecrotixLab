import type { Experience } from '../types/index';
import type { JourneyEntryState } from './journey-entry-state';

// Collapse only identical copies. Different revisions are retained for review.
export function mergeBackgroundEntries(experience: Experience[], journey: Experience[], state: JourneyEntryState) {
    const entries = [...experience];
    const flags = { ...state.experience };
    for (const item of journey) {
        const existing = entries.find((entry) => entry.id === item.id);
        const legacyFlags = state.journey[item.id];
        if (existing && JSON.stringify(existing) === JSON.stringify(item)) {
            const current = flags[item.id];
            flags[item.id] = { hidden: !!current?.hidden || !!legacyFlags?.hidden, archived: !!current?.archived || !!legacyFlags?.archived };
            continue;
        }
        let id = item.id;
        if (existing) {
            id = `${item.id.slice(0, 100)}-legacy`;
            let suffix = 1;
            while (entries.some((entry) => entry.id === id)) id = `${item.id.slice(0, 100)}-legacy-${suffix++}`;
        }
        entries.push({ ...item, id });
        if (legacyFlags) flags[id] = legacyFlags;
    }
    return { entries, state: { ...state, journey: {}, experience: flags } };
}
