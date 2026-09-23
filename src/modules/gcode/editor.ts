export function insertAtSelection(source: string, start: number, end: number, snippet: string) {
    const text = source.slice(0, start) + snippet + source.slice(end);
    return { text, cursor: start + snippet.length };
}
export function formatGCode(source: string) {
    return source.split(/\r?\n/).map((raw) => {
        const semicolon = raw.indexOf(';');
        const head = semicolon < 0 ? raw : raw.slice(0, semicolon);
        const comment = semicolon < 0 ? '' : raw.slice(semicolon);
        // Keep parenthesized controller comments as written and never reorder words.
        const pieces = head.split(/(\([^)]*\))/g);
        const normalized = pieces.map((piece) => piece.startsWith('(') ? piece : piece.toUpperCase().replace(/([A-Z])\s+([+-]?(?:\d|\.))/g, '$1$2').replace(/\s+/g, ' ').trim()).filter(Boolean).join(' ');
        return `${normalized}${normalized && comment ? ' ' : ''}${comment.trim()}`;
    }).join('\n');
}
export function toggleLineComment(source: string, start: number, end: number) {
    const lineStart = source.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    const lineEndIndex = source.indexOf('\n', end);
    const lineEnd = lineEndIndex < 0 ? source.length : lineEndIndex;
    const section = source.slice(lineStart, lineEnd);
    const lines = section.split('\n');
    const commented = lines.every((line) => /^\s*;/.test(line));
    const replacement = lines.map((line) => commented ? line.replace(/^([ \t]*);\s?/, '$1') : `; ${line}`).join('\n');
    return { text: source.slice(0, lineStart) + replacement + source.slice(lineEnd), start: lineStart, end: lineStart + replacement.length };
}
