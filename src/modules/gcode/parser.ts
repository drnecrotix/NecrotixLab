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
    let x = 0, y = 0, absolute = true, motion = 0, distance = 0;
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
        if (gCodes.includes(90)) absolute = true;
        if (gCodes.includes(91)) absolute = false;
        const nextMotion = gCodes.find((code) => code >= 0 && code <= 3);
        if (nextMotion !== undefined) motion = nextMotion;
        if (motion > 1 && (values.has('X') || values.has('Y'))) issues.push({ line: lineNumber, level: 'warning', message: 'Arc is previewed as a straight segment.' });
        if (values.has('F') && Number(values.get('F')) <= 0) issues.push({ line: lineNumber, level: 'error', message: 'Feed rate must be greater than zero.' });
        if (!values.has('X') && !values.has('Y')) return;

        const nextX = values.has('X') ? (absolute ? values.get('X')! : x + values.get('X')!) : x;
        const nextY = values.has('Y') ? (absolute ? values.get('Y')! : y + values.get('Y')!) : y;
        distance += Math.hypot(nextX - x, nextY - y);
        x = nextX; y = nextY;
        points.push({ x, y, rapid: motion === 0, line: lineNumber });
    });

    if (!/\bM(?:2|30)\b/i.test(source)) issues.push({ line: lines.length, level: 'warning', message: 'Program has no M2 or M30 end command.' });
    const xs = points.map((point) => point.x), ys = points.map((point) => point.y);
    return {
        points, issues, lineCount: lines.length, motionCount: Math.max(0, points.length - 1), distance,
        bounds: { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) },
    };
}
