import type { Project as PrismaProject } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';
import type { Project, ProjectContentBlock } from '@/types';
import { normalizeProjectStatus } from '@/lib/project-status';
import {
    chroniclesFromHtml,
    composeProjectLayout,
    extractProjectBlocks,
    featuresFromHtml,
    installationFromHtml,
    normalizeProjectBlockMarkers,
} from '@/lib/project-blocks';

type ProjectContent = {
    image?: string;
    downloadUrl?: string;
    galleryImages?: string[];
    features?: { title: string; items: string[] }[];
    installation?: { title: string; cmd?: string; code?: string; type: 'code' | 'text' }[];
    challengesAndSolutions?: { problem: string; solution: string }[];
};

const MAX_LIST_ITEMS = 50;
const MAX_LIST_ITEM_LENGTH = 120;
const BLOCK_PATTERN = /\[\[\/?(?:mission|features|chronicles|installation)\]\]/gi;

function sanitizeProjectDescription(value?: string | null) {
    if (!value) return undefined;
    const hoisted = normalizeProjectBlockMarkers(value) || '';
    return sanitizeHtml(hoisted, {
        allowedTags: ['p', 'br', 'h2', 'h3', 'h4', 'strong', 'em', 's', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'div'],
        allowedAttributes: {
            a: ['href', 'target', 'rel'],
            p: ['data-project-block'],
            div: ['data-project-block'],
        },
        allowedSchemes: ['http', 'https', 'mailto'],
        transformTags: {
            a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
        },
    }).trim();
}

function projectDescriptionText(value?: string | null) {
    const sanitized = normalizeProjectBlockMarkers(sanitizeProjectDescription(value));
    if (!sanitized) return undefined;
    const withoutBlocks = sanitized.replace(BLOCK_PATTERN, '');
    return sanitizeHtml(withoutBlocks, {
        allowedTags: [],
        allowedAttributes: {},
    }).replace(/\s+/g, ' ').trim() || undefined;
}

function bodyForBlock(layout: string, block: ProjectContentBlock) {
    const segment = composeProjectLayout(layout).find((item) => item.type === 'block' && item.block === block);
    return segment && segment.type === 'block' ? segment.body : undefined;
}

export function cmsProjectToPortfolioProject(project: PrismaProject): Project {
    const content = (project.content ?? {}) as unknown as ProjectContent;
    const contentLayout = normalizeProjectBlockMarkers(sanitizeProjectDescription(project.longDescription));
    const contentBlocks = extractProjectBlocks(contentLayout);
    const layout = contentLayout || '';

    const features = content.features?.length
        ? content.features
        : contentBlocks.includes('features')
            ? featuresFromHtml(bodyForBlock(layout, 'features'))
            : undefined;
    const installation = content.installation?.length
        ? content.installation
        : contentBlocks.includes('installation')
            ? installationFromHtml(bodyForBlock(layout, 'installation'))
            : undefined;
    const challengesAndSolutions = content.challengesAndSolutions?.length
        ? content.challengesAndSolutions
        : contentBlocks.includes('chronicles')
            ? chroniclesFromHtml(bodyForBlock(layout, 'chronicles'))
            : undefined;

    return {
        id: project.id,
        slug: project.slug,
        title: project.title,
        description: project.description,
        longDescription: projectDescriptionText(project.longDescription),
        contentLayout,
        contentBlocks,
        image: content.image,
        techStack: project.technologies,
        tools: project.tools,
        status: normalizeProjectStatus(project.status),
        demoUrl: project.demoUrl ?? undefined,
        downloadUrl: content.downloadUrl,
        repoUrl: project.repoUrl ?? undefined,
        startDate: (project.publishedAt ?? project.createdAt).toISOString().slice(0, 10),
        highlights: project.highlights,
        category: project.category ?? undefined,
        features: features?.length ? features : undefined,
        installation: installation?.length ? installation : undefined,
        challengesAndSolutions: challengesAndSolutions?.length ? challengesAndSolutions : undefined,
        galleryImages: content.galleryImages,
        team: project.team ?? undefined,
        customTimeline: project.timeline ?? undefined,
        role: project.role ?? undefined,
    };
}

export function csvToList(value: FormDataEntryValue | null) {
    return String(value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, MAX_LIST_ITEMS)
        .map((item) => item.slice(0, MAX_LIST_ITEM_LENGTH));
}

export function normalizeProjectUrl(value: FormDataEntryValue | null) {
    const raw = String(value ?? '').trim();
    if (!raw) return null;
    if (raw.length > 2048) throw new Error('Project URL is too long.');

    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Project URLs must use http or https.');
    }
    return parsed.toString();
}

export function normalizeProjectMediaUrl(value: FormDataEntryValue | null) {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    if (raw.startsWith('/')) return raw.slice(0, 2048);
    return normalizeProjectUrl(raw) ?? '';
}

export function safeProjectContent(value: FormDataEntryValue | null): ProjectContent {
    const raw = String(value ?? '').trim();
    if (!raw) return {};
    if (raw.length > 100_000) throw new Error('Project content JSON is too large.');

    const parsed = JSON.parse(raw) as ProjectContent;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Project content must be a JSON object.');
    }

    if (parsed.galleryImages) {
        if (!Array.isArray(parsed.galleryImages)) throw new Error('Gallery images must be an array.');
        parsed.galleryImages = parsed.galleryImages.slice(0, 30).map((item) => normalizeProjectMediaUrl(String(item)));
    }

    if (parsed.image) parsed.image = normalizeProjectMediaUrl(parsed.image);
    if (parsed.downloadUrl) parsed.downloadUrl = normalizeProjectUrl(parsed.downloadUrl) ?? undefined;
    return parsed;
}
