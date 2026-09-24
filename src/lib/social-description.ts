import sanitizeHtml from 'sanitize-html';

/** A deterministic share summary, used only when no editorial override exists. */
export function socialDescription(source?: string | null, maxLength = 180): string {
    if (!source) return '';
    const plain = sanitizeHtml(source.replace(/<\/(?:p|div|h[1-6]|li|blockquote|pre|section)>/gi, '$& '), { allowedTags: [], allowedAttributes: {}, parser: { decodeEntities: true } })
        .replace(/\[\[\/?(?:mission|features|chronicles|installation)\]\]/gi, ' ')
        .replace(/&(#(?:x[0-9a-f]+|[0-9]+)|amp|lt|gt|quot|apos|nbsp|hellip);/gi, (entity, value: string) => {
            const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…' };
            if (!value.startsWith('#')) return named[value.toLowerCase()] ?? entity;
            const code = value[1]?.toLowerCase() === 'x' ? Number.parseInt(value.slice(2), 16) : Number.parseInt(value.slice(1), 10);
            return Number.isInteger(code) && code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : entity;
        })
        .replace(/\s+/g, ' ').trim();
    if (plain.length <= maxLength) return plain;
    const cut = plain.slice(0, maxLength - 1);
    const wordEnd = cut.lastIndexOf(' ');
    return `${(wordEnd > maxLength * 0.65 ? cut.slice(0, wordEnd) : cut).trimEnd()}…`;
}
