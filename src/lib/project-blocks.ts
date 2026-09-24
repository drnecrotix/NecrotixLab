import type { ProjectContentBlock } from '@/types';

export const PROJECT_BLOCKS: ProjectContentBlock[] = ['mission', 'features', 'chronicles', 'installation'];
export const BLOCK_TOKEN = /^\[\[(mission|features|chronicles|installation)\]\]$/i;
export const BLOCK_PATTERN = /\[\[(mission|features|chronicles|installation)\]\]/gi;
export const BLOCK_SPLIT = /(\[\[(?:mission|features|chronicles|installation)\]\])/gi;

export type FeatureGroup = { title: string; items: string[] };
export type ChronicleEntry = { problem: string; solution: string };
export type InstallationStep = { title: string; cmd?: string; code?: string; type: 'code' | 'text' };
export type LayoutSegment =
    | { type: 'html'; html: string }
    | { type: 'block'; block: ProjectContentBlock; body?: string };

function findMatchingClose(html: string, from: number, tag: string) {
    const open = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
    const close = new RegExp(`</${tag}\\s*>`, 'gi');
    let depth = 1;
    let index = from;

    while (index < html.length && depth > 0) {
        open.lastIndex = index;
        close.lastIndex = index;
        const nextOpen = open.exec(html);
        const nextClose = close.exec(html);
        if (!nextClose) return html.length;
        if (nextOpen && nextOpen.index < nextClose.index) {
            depth += 1;
            index = nextOpen.index + nextOpen[0].length;
            continue;
        }
        depth -= 1;
        index = nextClose.index + nextClose[0].length;
    }

    return index;
}

export function hoistProjectBlockNodes(html: string) {
    const opener = /<([a-z0-9]+)([^>]*\bdata-project-block=["']?(mission|features|chronicles|installation)["']?[^>]*)>/gi;
    let output = '';
    let last = 0;
    let match: RegExpExecArray | null;
    opener.lastIndex = 0;

    while ((match = opener.exec(html))) {
        const tag = match[1];
        const kind = match[3].toLowerCase() as ProjectContentBlock;
        output += html.slice(last, match.index);
        if (/\/\s*$/.test(match[2])) {
            output += `[[${kind}]]`;
            last = opener.lastIndex;
            continue;
        }
        const closeAt = findMatchingClose(html, opener.lastIndex, tag);
        output += `[[${kind}]]`;
        last = closeAt;
        opener.lastIndex = closeAt;
    }

    return output + html.slice(last);
}

export function normalizeProjectBlockMarkers(value?: string | null) {
    if (!value) return undefined;
    return hoistProjectBlockNodes(value)
        .replace(/&lbrack;&lbrack;(mission|features|chronicles|installation)&rbrack;&rbrack;/gi, '[[$1]]')
        .replace(
            /<p[^>]*>\s*(?:<(?:strong|em|s)[^>]*>\s*)*\[\[(mission|features|chronicles|installation)\]\](?:\s*<\/(?:strong|em|s)>)*\s*<\/p>/gi,
            '[[$1]]',
        )
        .replace(/<p[^>]*>\s*\[\[(mission|features|chronicles|installation)\]\]/gi, '[[$1]]')
        .replace(/\[\[(mission|features|chronicles|installation)\]\]\s*<\/p>/gi, '[[$1]]');
}

export function extractProjectBlocks(value?: string | null): ProjectContentBlock[] {
    if (!value) return [];
    const found = new Set<ProjectContentBlock>();
    for (const match of value.matchAll(BLOCK_PATTERN)) {
        const block = match[1]?.toLowerCase() as ProjectContentBlock;
        if (PROJECT_BLOCKS.includes(block)) found.add(block);
    }
    return [...found];
}

export function matchProjectBlock(part: string): ProjectContentBlock | null {
    const match = part.trim().match(BLOCK_TOKEN);
    return match ? match[1].toLowerCase() as ProjectContentBlock : null;
}

export function splitLayoutParts(layout: string) {
    return layout.split(BLOCK_SPLIT).filter((part) => part.trim().length > 0);
}

function stripHtml(value: string) {
    return value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function listItems(html: string) {
    return [...html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
        .map((match) => stripHtml(match[1]))
        .filter(Boolean);
}

export function featuresFromHtml(html?: string): FeatureGroup[] {
    if (!html?.trim()) return [];
    const groupPattern = /<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>\s*<(ul|ol)\b[^>]*>([\s\S]*?)<\/\2>/gi;
    const matches = [...html.matchAll(groupPattern)];
    // Mixed prose and feature lists must remain visible as authored, not be
    // silently swallowed by the generated card layout.
    if (stripHtml(html.replace(groupPattern, '')).trim()) return [];
    return matches
        .map((match) => ({ title: stripHtml(match[1]), items: listItems(match[3]) }))
        .filter((group) => group.title)
        .filter((group) => group.items.length > 0);
}

export function chroniclesFromHtml(html?: string): ChronicleEntry[] {
    if (!html?.trim()) return [];
    const entries: ChronicleEntry[] = [];
    const chunks = html.split(/<h[2-4]\b[^>]*>/i).slice(1);
    for (const chunk of chunks) {
        const headingEnd = chunk.search(/<\/h[2-4]>/i);
        if (headingEnd < 0) continue;
        const problem = stripHtml(chunk.slice(0, headingEnd));
        const solution = stripHtml(chunk.slice(headingEnd).replace(/^<\/h[2-4]>/i, ''));
        if (problem && solution) entries.push({ problem, solution });
    }
    return entries;
}

export function installationFromHtml(html?: string): InstallationStep[] {
    if (!html?.trim()) return [];
    const steps: InstallationStep[] = [];
    const codeBlocks = [...html.matchAll(/<pre\b[^>]*>\s*(?:<code\b[^>]*>)?([\s\S]*?)(?:<\/code>)?\s*<\/pre>/gi)];
    if (codeBlocks.length) {
        codeBlocks.forEach((match, index) => {
            const code = stripHtml(match[1]);
            if (code) steps.push({ title: `Step ${index + 1}`, cmd: code, code, type: 'code' });
        });
        return steps;
    }

    const items = listItems(html);
    if (items.length) {
        return items.map((item, index) => ({ title: `Step ${index + 1}`, cmd: item, code: item, type: 'text' as const }));
    }

    const chunks = html.split(/<h[2-4]\b[^>]*>/i).slice(1);
    for (const chunk of chunks) {
        const headingEnd = chunk.search(/<\/h[2-4]>/i);
        if (headingEnd < 0) continue;
        const title = stripHtml(chunk.slice(0, headingEnd)) || 'Step';
        const body = stripHtml(chunk.slice(headingEnd).replace(/^<\/h[2-4]>/i, ''));
        if (title && body) steps.push({ title, code: body, cmd: body, type: 'text' });
    }
    return steps;
}

export function composeProjectLayout(layout: string): LayoutSegment[] {
    const parts = splitLayoutParts(layout);
    const segments: LayoutSegment[] = [];

    for (const part of parts) {
        const block = matchProjectBlock(part);
        // A marker inserts its own section. Content typed after it is a
        // separate document segment, regardless of the block kind.
        segments.push(block ? { type: 'block', block } : { type: 'html', html: part });
    }

    return segments;
}
