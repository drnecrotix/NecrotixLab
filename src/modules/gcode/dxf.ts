export type DxfEntity = { kind: string; points: { x: number; y: number }[]; layer: string };
export function inspectDxf(source: string) {
    if (source.length > 5_000_000) throw new Error('DXF exceeds the 5 MB limit.');
    const lines = source.replace(/\r/g, '').split('\n');
    const pairs: { code: number; value: string }[] = [];
    for (let i = 0; i + 1 < lines.length; i += 2) {
        const code = Number(lines[i]?.trim());
        if (Number.isInteger(code)) pairs.push({ code, value: lines[i + 1]!.trim() });
    }
    if (!pairs.some((p) => p.code === 0 && p.value === 'SECTION')) throw new Error('Not an ASCII DXF file. Binary DXF is not supported.');
    let section = '', kind = '', fields: typeof pairs = [];
    const entities: DxfEntity[] = [];
    const counts: Record<string, number> = {};
    const flush = () => {
        if (!kind || kind === 'SECTION' || !section || section !== 'ENTITIES') return;
        counts[kind] = (counts[kind] ?? 0) + 1;
        const get = (code: number) => Number(fields.find((p) => p.code === code)?.value ?? 0);
        const layer = fields.find((p) => p.code === 8)?.value ?? '0';
        const points: DxfEntity['points'] = [];
        if (kind === 'LINE') points.push({ x: get(10), y: get(20) }, { x: get(11), y: get(21) });
        if (kind === 'LWPOLYLINE') {
            let point: { x: number; y: number } | null = null;
            for (const field of fields) {
                if (field.code === 10) { point = { x: Number(field.value), y: 0 }; points.push(point); }
                if (field.code === 20 && point) point.y = Number(field.value);
            }
            if ((get(70) & 1) && points.length > 1) points.push({ ...points[0]! });
        }
        if (kind === 'CIRCLE' || kind === 'ARC') {
            const start = kind === 'ARC' ? get(50) : 0, end = kind === 'ARC' ? get(51) : 360;
            const span = ((end - start + 360) % 360) || 360, steps = Math.max(12, Math.ceil(span / 10));
            for (let i = 0; i <= steps; i++) { const angle = (start + span * i / steps) * Math.PI / 180; points.push({ x: get(10) + get(40) * Math.cos(angle), y: get(20) + get(40) * Math.sin(angle) }); }
        }
        if (points.length && points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))) entities.push({ kind, points, layer });
    };
    for (const pair of pairs) {
        if (pair.code === 0) {
            flush(); fields = []; kind = pair.value;
            if (kind === 'ENDSEC') section = '';
        } else if (kind === 'SECTION' && pair.code === 2) section = pair.value;
        else fields.push(pair);
    }
    flush();
    if (entities.length > 10000) throw new Error('Too many entities to preview.');
    const points = entities.flatMap((entity) => entity.points);
    const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
    return { entities, counts, layers: [...new Set(entities.map((e) => e.layer))], bounds: points.length ? { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) } : null, unsupported: Object.entries(counts).filter(([kind]) => !['LINE', 'LWPOLYLINE', 'CIRCLE', 'ARC'].includes(kind)).map(([kind, count]) => `${kind} (${count})`) };
}
