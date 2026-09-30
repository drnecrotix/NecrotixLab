import type { GCodePoint } from './parser';
export type ToolpathSegment = { from: GCodePoint; to: GCodePoint; index: number };
// The initial origin is a simulator assumption, not a commanded move.
export function toolpathSegments(points: GCodePoint[]): ToolpathSegment[] {
    return points.slice(1).flatMap((to, i) => {
        const from = points[i];
        if (from.line === 0 || from.x === to.x && from.y === to.y) return [];
        return [{ from, to, index: i + 1 }];
    });
}
export function visibleToolpath(segments: ToolpathSegment[], step: number, showPlanned = false, showRapid = true) {
    return segments.filter(segment => (showRapid || !segment.to.rapid) && (showPlanned || segment.to.line <= step));
}
