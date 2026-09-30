import type { GCodePoint } from './parser';
export type Plane = 'xy' | 'xz' | 'yz';
export type ToolpathSegment = { from: GCodePoint; to: GCodePoint; index: number };
export type MotionKind = 'cutting' | 'air' | 'rapid' | 'rapid-low' | 'spindle-off';
export type ClassifiedSegment = ToolpathSegment & { kind: MotionKind };
export function projectPoint(point: GCodePoint, plane: Plane) {
    return { x: plane === 'yz' ? point.y : point.x, y: plane === 'xy' ? point.y : point.z };
}
export function motionSegments(points: GCodePoint[]): ToolpathSegment[] {
    return points.slice(1).flatMap((to, i) => {
        const from = points[i];
        if (from.line === 0 || !from.xyKnown && (from.x !== to.x || from.y !== to.y) || from.x === to.x && from.y === to.y && from.z === to.z) return [];
        return [{ from, to, index: i + 1 }];
    });
}
export function toolpathSegments(points: GCodePoint[], plane: Plane = 'xy') {
    return motionSegments(points).filter(s => {
        const a = projectPoint(s.from, plane), b = projectPoint(s.to, plane);
        return a.x !== b.x || a.y !== b.y;
    });
}
export function visibleToolpath<T extends ToolpathSegment>(segments: T[], step: number, showPlanned = false, showRapid = true): T[] {
    return segments.filter(s => (showRapid || !s.to.rapid) && (showPlanned || s.to.line <= step));
}
// A surface-plane estimate, not a solid-stock/material-removal simulation.
export function classifySegments(segments: ToolpathSegment[], surfaceZ: number): ClassifiedSegment[] {
    return segments.flatMap(s => {
        const dz = s.to.z - s.from.z;
        const t = dz === 0 ? -1 : (surfaceZ - s.from.z) / dz;
        const pieces = t > 0 && t < 1 ? (() => {
            const p = { ...s.to, x: s.from.x + (s.to.x - s.from.x) * t, y: s.from.y + (s.to.y - s.from.y) * t, z: surfaceZ };
            return [{ ...s, to: p }, { ...s, from: p }];
        })() : [s];
        return pieces.map(piece => {
            const below = (piece.from.z + piece.to.z) / 2 < surfaceZ - 1e-8;
            const kind: MotionKind = piece.to.rapid ? (below ? 'rapid-low' : 'rapid') : !below ? 'air' : piece.to.spindleActive ? 'cutting' : 'spindle-off';
            return { ...piece, kind };
        });
    });
}
