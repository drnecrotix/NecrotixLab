export type GCodePoint = { x: number; y: number; rapid: boolean; line: number };
export type GCodeIssue = { line: number; level: 'error' | 'warning'; message: string };
export type GCodeFrame = {
    line: number; code: string; action: string; detail: string;
    x: number; y: number; z: number; feed: number; spindleSpeed: number;
    spindle: 'off' | 'clockwise' | 'counterclockwise'; coolant: boolean;
    tool: number | null; units: 'mm' | 'in'; absolute: boolean; workOffset: string;
    motion: 'rapid' | 'cut' | 'arc-cw' | 'arc-ccw' | 'none';
};
export type GCodeAnalysis = {
    points: GCodePoint[]; frames: GCodeFrame[]; issues: GCodeIssue[];
    lineCount: number; motionCount: number; distance: number;
    bounds: { minX: number; maxX: number; minY: number; maxY: number };
};
const supportedWords = new Set(['G', 'M', 'X', 'Y', 'Z', 'I', 'J', 'K', 'R', 'F', 'S', 'T', 'N', 'P', 'L']);
const safeG = new Set([0, 1, 2, 3, 4, 17, 18, 19, 20, 21, 40, 43, 49, 53, 54, 55, 56, 57, 58, 59, 80, 90, 91, 94]);
const safeM = new Set([2, 3, 4, 5, 6, 7, 8, 9, 30]);

export function analyzeGCode(source: string): GCodeAnalysis {
    const points: GCodePoint[] = [{ x: 0, y: 0, rapid: true, line: 0 }];
    const frames: GCodeFrame[] = [];
    const issues: GCodeIssue[] = [];
    let x = 0, y = 0, z = 0, absolute = true, motion = 0, distance = 0, motionCount = 0;
    let feed = 0, spindleSpeed = 0, spindle: GCodeFrame['spindle'] = 'off', coolant = false;
    let units: GCodeFrame['units'] = 'mm', tool: number | null = null, workOffset = 'G54', plane = 17;
    let unitsSet = false, planeSet = false, feedSet = false, safeRetract = false, ended = false;
    const lines = source.split(/\r?\n/);
    lines.forEach((raw, index) => {
        const lineNumber = index + 1;
        const line = raw.replace(/\([^)]*\)/g, '').replace(/;.*$/, '').trim().toUpperCase();
        const actions: string[] = [];
        let detail = '';
        let lineMotion: GCodeFrame['motion'] = 'none';
        if (!line || line === '%') {
            frames.push({ line: lineNumber, code: raw, action: 'Comment / blank line', detail: 'No machine motion.', x, y, z, feed, spindleSpeed, spindle, coolant, tool, units, absolute, workOffset, motion: 'none' });
            return;
        }
        if (ended) issues.push({ line: lineNumber, level: 'warning', message: 'Command appears after program end.' });
        const words = [...line.matchAll(/([A-Z])\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))/g)];
        const residue = line.replace(/([A-Z])\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))/g, '').replace(/\s+/g, '');
        if (residue) issues.push({ line: lineNumber, level: 'error', message: `Cannot parse "${residue.slice(0, 18)}".` });
        for (const match of words) if (!supportedWords.has(match[1]!)) issues.push({ line: lineNumber, level: 'warning', message: `${match[1]} is not analysed by the preview.` });
        const values = new Map(words.map((match) => [match[1]!, Number(match[2])]));
        const gCodes = words.filter((match) => match[1] === 'G').map((match) => Number(match[2]));
        const mCodes = words.filter((match) => match[1] === 'M').map((match) => Number(match[2]));
        for (const code of gCodes) if (!safeG.has(code)) issues.push({ line: lineNumber, level: 'warning', message: `G${code} is not modelled by this simulator.` });
        for (const code of mCodes) if (!safeM.has(code)) issues.push({ line: lineNumber, level: 'warning', message: `M${code} is not modelled by this simulator.` });
        if (gCodes.includes(20) || gCodes.includes(21)) { units = gCodes.includes(21) ? 'mm' : 'in'; unitsSet = true; actions.push(`Units: ${units}`); }
        if (gCodes.some((code) => [17, 18, 19].includes(code))) { plane = gCodes.find((code) => [17, 18, 19].includes(code))!; planeSet = true; actions.push(`Plane: G${plane}`); }
        if (gCodes.includes(90) || gCodes.includes(91)) { absolute = gCodes.includes(90); actions.push(absolute ? 'Absolute positions' : 'Incremental positions'); }
        const offset = gCodes.find((code) => code >= 54 && code <= 59);
        if (offset !== undefined) { workOffset = `G${offset}`; actions.push(`Work offset ${workOffset}`); }
        if (gCodes.includes(40)) actions.push('Cutter compensation off');
        if (gCodes.includes(49)) actions.push('Tool length compensation off');
        if (gCodes.includes(80)) actions.push('Canned cycle cancelled');
        if (gCodes.includes(94)) actions.push('Feed per minute');
        if (values.has('F')) { feed = values.get('F')!; if (feed <= 0) issues.push({ line: lineNumber, level: 'error', message: 'Feed rate must be greater than zero.' }); else feedSet = true; actions.push(`Feed ${feed} ${units}/min`); }
        if (values.has('S')) { spindleSpeed = values.get('S')!; actions.push(`Spindle setting ${spindleSpeed} RPM`); }
        if (values.has('T')) { tool = values.get('T')!; actions.push(`Tool T${tool} selected`); }
        if (mCodes.includes(3) || mCodes.includes(4)) { spindle = mCodes.includes(3) ? 'clockwise' : 'counterclockwise'; actions.push(`Spindle ${spindle}`); if (!spindleSpeed) issues.push({ line: lineNumber, level: 'warning', message: 'Spindle starts without an S speed.' }); }
        if (mCodes.includes(5)) { spindle = 'off'; actions.push('Spindle stopped'); }
        if (mCodes.includes(7) || mCodes.includes(8)) { coolant = true; actions.push('Coolant on'); }
        if (mCodes.includes(9)) { coolant = false; actions.push('Coolant off'); }
        if (mCodes.includes(6)) actions.push(`Tool change${tool !== null ? ` to T${tool}` : ''} - verify machine position`);
        if (mCodes.includes(2) || mCodes.includes(30)) { ended = true; actions.push('Program end'); }
        const nextMotion = gCodes.find((code) => code >= 0 && code <= 3);
        if (nextMotion !== undefined) motion = nextMotion;
        const hasAxis = values.has('X') || values.has('Y') || values.has('Z');
        const unsupportedMove = hasAxis && (gCodes.includes(53) || gCodes.some((code) => !safeG.has(code)) || plane !== 17 && motion >= 2);
        if (unsupportedMove) {
            issues.push({ line: lineNumber, level: 'warning', message: 'Axis movement is not previewed for this machine-coordinate, plane or unsupported command.' });
            actions.push('Unmodelled axis command');
        } else if (hasAxis) {
            const nextX = values.has('X') ? (absolute ? values.get('X')! : x + values.get('X')!) : x;
            const nextY = values.has('Y') ? (absolute ? values.get('Y')! : y + values.get('Y')!) : y;
            const nextZ = values.has('Z') ? (absolute ? values.get('Z')! : z + values.get('Z')!) : z;
            lineMotion = motion === 0 ? 'rapid' : motion === 1 ? 'cut' : motion === 2 ? 'arc-cw' : 'arc-ccw';
            if (motion === 0 && nextZ > 0) safeRetract = true;
            if (motion === 0 && (values.has('X') || values.has('Y')) && z < 0) issues.push({ line: lineNumber, level: 'warning', message: 'Rapid XY motion below Z0 - verify clearance.' });
            if (motion > 0 && !feedSet) issues.push({ line: lineNumber, level: 'warning', message: 'Cutting move before a positive feed is set.' });
            if (motion === 0) actions.push('Rapid positioning');
            else if (motion === 1) actions.push('Linear feed move');
            else actions.push(motion === 2 ? 'Clockwise arc' : 'Counterclockwise arc');
            detail = `X ${x.toFixed(2)} → ${nextX.toFixed(2)} · Y ${y.toFixed(2)} → ${nextY.toFixed(2)} · Z ${z.toFixed(2)} → ${nextZ.toFixed(2)} ${units}`;
            if (values.has('X') || values.has('Y')) {
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
                } else if (motion <= 1) {
                    distance += Math.hypot(nextX - x, nextY - y);
                    points.push({ x: nextX, y: nextY, rapid: motion === 0, line: lineNumber });
                } else issues.push({ line: lineNumber, level: 'warning', message: 'Arc needs I/J center offsets; XY path is omitted.' });
            }
            x = nextX; y = nextY; z = nextZ;
        }
        if (gCodes.includes(4)) actions.push(`Dwell${values.has('P') ? ` P${values.get('P')}` : ''} - time depends on controller`);
        frames.push({ line: lineNumber, code: raw, action: actions.join(' · ') || 'No modelled action', detail: detail || 'Machine position unchanged in this preview.', x, y, z, feed, spindleSpeed, spindle, coolant, tool, units, absolute, workOffset, motion: lineMotion });
    });
    if (!unitsSet) issues.push({ line: 1, level: 'warning', message: 'Set units explicitly with G20 or G21.' });
    if (!planeSet && points.length > 2) issues.push({ line: 1, level: 'warning', message: 'Set XY plane explicitly with G17.' });
    if (!feedSet && points.some((point) => !point.rapid)) issues.push({ line: 1, level: 'warning', message: 'Set a positive feed before cutting.' });
    if (!safeRetract && points.length > 2) issues.push({ line: 1, level: 'warning', message: 'No positive rapid Z clearance detected.' });
    if (!ended) issues.push({ line: lines.length, level: 'warning', message: 'Program has no M2 or M30 end command.' });
    const xs = points.map((point) => point.x), ys = points.map((point) => point.y);
    return { points, frames, issues, lineCount: lines.length, motionCount, distance, bounds: { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) } };
}
