export type GCodePoint = { x: number; y: number; rapid: boolean; line: number };
export type GCodeIssue = { line: number; level: 'error' | 'warning'; message: string };
export type GCodeAnalysis = {
    points: GCodePoint[];
    issues: GCodeIssue[];
    lineCount: number;
    motionCount: number;
    distance: number;
    bounds: { minX: number; maxX: number; minY: number; maxY: number };
};

const supportedWords = new Set(['G', 'M', 'X', 'Y', 'Z', 'I', 'J', 'K', 'R', 'F', 'S', 'T', 'N', 'P', 'L']);

export function analyzeGCode(source: string): GCodeAnalysis {
    const points: GCodePoint[] = [{ x: 0, y: 0, rapid: true, line: 0 }];
    const issues: GCodeIssue[] = [];
    let x = 0, y = 0, z = 0, absolute = true, motion = 0, distance = 0, motionCount = 0;
    let unitsSet = false, planeSet = false, feedSet = false, safeRetract = false;
    const lines = source.split(/\r?\n/);

    lines.forEach((raw, index) => {
        const lineNumber = index + 1;
        const line = raw.replace(/\([^)]*\)/g, '').replace(/;.*$/, '').trim().toUpperCase();
        if (!line || line === '%') return;
        const words = [...line.matchAll(/([A-Z])\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))/g)];
        const residue = line.replace(/([A-Z])\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))/g, '').replace(/\s+/g, '');
        if (residue) issues.push({ line: lineNumber, level: 'error', message: `Cannot parse "${residue.slice(0, 18)}".` });
        for (const match of words) if (!supportedWords.has(match[1]!)) issues.push({ line: lineNumber, level: 'warning', message: `${match[1]} is not analysed by the preview.` });

        const values = new Map(words.map((match) => [match[1]!, Number(match[2])]));
        const gCodes = words.filter((match) => match[1] === 'G').map((match) => Number(match[2]));
        if (gCodes.includes(20) || gCodes.includes(21)) unitsSet = true;
        if (gCodes.includes(17)) planeSet = true;
        if (values.has('F') && Number(values.get('F')) > 0) feedSet = true;
        if (gCodes.includes(90)) absolute = true;
        if (gCodes.includes(91)) absolute = false;
        const nextMotion = gCodes.find((code) => code >= 0 && code <= 3);
        if (nextMotion !== undefined) motion = nextMotion;
        if (values.has('Z')) { z = absolute ? values.get('Z')! : z + values.get('Z')!; if (motion === 0 && z > 0) safeRetract = true; }
        if (motion === 0 && (values.has('X') || values.has('Y')) && z < 0) issues.push({ line: lineNumber, level: 'warning', message: 'Rapid XY motion below Z0 - verify clearance.' });
        if (values.has('F') && Number(values.get('F')) <= 0) issues.push({ line: lineNumber, level: 'error', message: 'Feed rate must be greater than zero.' });
        if (!values.has('X') && !values.has('Y')) return;

        const nextX = values.has('X') ? (absolute ? values.get('X')! : x + values.get('X')!) : x;
        const nextY = values.has('Y') ? (absolute ? values.get('Y')! : y + values.get('Y')!) : y;
        motionCount++;
        if ((motion === 2 || motion === 3) && values.has('I') && values.has('J')) {
            const cx = x + values.get('I')!, cy = y + values.get('J')!;
            const radius = Math.hypot(x - cx, y - cy), targetRadius = Math.hypot(nextX - cx, nextY - cy);
            if (radius > 0 && Math.abs(radius - targetRadius) < Math.max(.01, radius * .001)) {
                const from = Math.atan2(y - cy, x - cx), to = Math.atan2(nextY - cy, nextX - cx);
                let sweep = motion === 3 ? (to - from + Math.PI * 2) % (Math.PI * 2) : (from - to + Math.PI * 2) % (Math.PI * 2);
                if (sweep < 1e-8) sweep = Math.PI * 2;
                const steps = Math.min(360, Math.max(8, Math.ceil(radius * sweep / 1.5)));
                for (let step = 1; step <= steps; step++) {
                    const angle = from + (motion === 3 ? 1 : -1) * sweep * step / steps;
                    const px = step === steps ? nextX : cx + radius * Math.cos(angle);
                    const py = step === steps ? nextY : cy + radius * Math.sin(angle);
                    const previous = points[points.length - 1]!;
                    distance += Math.hypot(px - previous.x, py - previous.y);
                    points.push({ x: px, y: py, rapid: false, line: lineNumber });
                }
            } else issues.push({ line: lineNumber, level: 'error', message: 'Arc radius does not match endpoint.' });
        } else {
            if (motion > 1) issues.push({ line: lineNumber, level: 'warning', message: 'Arc requires I/J center offsets for XY preview.' });
            distance += Math.hypot(nextX - x, nextY - y);
            points.push({ x: nextX, y: nextY, rapid: motion === 0, line: lineNumber });
        }
        x = nextX; y = nextY;
    });

    if (!unitsSet) issues.push({ line: 1, level: 'warning', message: 'Set units explicitly with G20 or G21.' });
    if (!planeSet && points.length > 2) issues.push({ line: 1, level: 'warning', message: 'Set XY plane explicitly with G17.' });
    if (!feedSet && points.some((p) => !p.rapid)) issues.push({ line: 1, level: 'warning', message: 'Set a positive feed before cutting.' });
    if (!safeRetract && points.length > 2) issues.push({ line: 1, level: 'warning', message: 'No positive rapid Z clearance detected.' });
    if (!/\bM(?:2|30)\b/i.test(source)) issues.push({ line: lines.length, level: 'warning', message: 'Program has no M2 or M30 end command.' });
    const xs = points.map((point) => point.x), ys = points.map((point) => point.y);
    return {
        points, issues, lineCount: lines.length, motionCount, distance,
        bounds: { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) },
    };
}
