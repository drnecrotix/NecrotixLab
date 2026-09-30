import type { GCodeFrame, GCodePoint } from './parser';

// Feed-aware, accelerated preview timing; rapid rate is illustrative, not machine configuration.
export function blockDuration(points: GCodePoint[], frame: GCodeFrame | undefined, speed: number) {
    if (!frame || frame.motion === 'none') return Math.max(60, speed / 4);
    const rate = frame.motion === 'rapid' ? 6000 : frame.feed * (frame.units === 'in' ? 25.4 : 1);
    const distance = points.slice(1).reduce((sum, to, i) => to.line === frame.line ? sum + Math.hypot(to.x - points[i].x, to.y - points[i].y, to.z - points[i].z) : sum, 0);
    return Math.max(100, Math.min(12000, distance / Math.max(1, rate) * 60000 * speed / 650 / 8));
}
export function interpolateBlock(points: GCodePoint[], line: number, fraction: number, fallback: GCodePoint): GCodePoint {
    const segments = points.slice(1).flatMap((to, i) => to.line === line && points[i].line > 0 ? [{ from: points[i], to, length: Math.hypot(to.x - points[i].x, to.y - points[i].y, to.z - points[i].z) }] : []);
    let remaining = segments.reduce((sum, s) => sum + s.length, 0) * Math.max(0, Math.min(1, fraction));
    for (const s of segments) {
        if (remaining <= s.length && s.length > 0) {
            const t = remaining / s.length;
            return { ...s.to, x: s.from.x + (s.to.x - s.from.x) * t, y: s.from.y + (s.to.y - s.from.y) * t, z: s.from.z + (s.to.z - s.from.z) * t };
        }
        remaining -= s.length;
    }
    return segments.at(-1)?.to ?? fallback;
}
