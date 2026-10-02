export type GalleryRow = { start: number; count: number; height: number; widths: number[] };
export function justifiedGalleryRows(ratios: number[], width: number, targetHeight = 240, gap = 8): GalleryRow[] {
    if (!Number.isFinite(width) || width <= 0 || !ratios.length) return [];
    const safe = ratios.map(ratio => Number.isFinite(ratio) && ratio > 0 ? Math.max(0.4, Math.min(3, ratio)) : 4 / 3);
    const rows: GalleryRow[] = [];
    let start = 0;
    while (start < safe.length) {
        let count = 1, sum = safe[start];
        while (start + count < safe.length && (width - gap * (count - 1)) / sum > targetHeight) {
            const nextSum = sum + safe[start + count];
            const before = (width - gap * (count - 1)) / sum;
            const after = (width - gap * count) / nextSum;
            if (count > 1 && Math.abs(before - targetHeight) < Math.abs(after - targetHeight)) break;
            sum = nextSum; count++;
        }
        const available = Math.max(1, width - gap * (count - 1));
        const fullHeight = available / sum;
        const height = start + count === safe.length ? Math.min(targetHeight, fullHeight) : fullHeight;
        rows.push({ start, count, height, widths: safe.slice(start, start + count).map(ratio => ratio * height) });
        start += count;
    }
    return rows;
}
