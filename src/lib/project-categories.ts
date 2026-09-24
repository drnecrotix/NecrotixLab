import { prisma } from '@/lib/prisma';

export const PROJECT_CATEGORIES_CONFIG_SLUG = '__project-categories-config';

export type ProjectCategoryRecord = {
    id: string;
    name: string;
    slug: string;
    description: string;
    sortOrder: number;
    isActive: boolean;
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugifyProjectCategory(value: string) {
    const slug = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
    return slug || 'category';
}

function normalizeItem(value: unknown, index: number): ProjectCategoryRecord | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const source = value as Record<string, unknown>;
    const name = String(source.name ?? '').trim().slice(0, 120);
    if (!name) return null;
    const rawSlug = String(source.slug ?? '').trim().toLowerCase();
    const slug = slugPattern.test(rawSlug) ? rawSlug : slugifyProjectCategory(name);
    const sortOrder = Number(source.sortOrder);
    return {
        id: String(source.id ?? slug).trim() || `category-${index + 1}`,
        name,
        slug,
        description: String(source.description ?? '').trim().slice(0, 500),
        sortOrder: Number.isInteger(sortOrder) ? Math.max(-10000, Math.min(10000, sortOrder)) : (index + 1) * 10,
        isActive: source.isActive !== false,
    };
}

export function normalizeProjectCategoryRecords(value: unknown): ProjectCategoryRecord[] {
    const items = Array.isArray(value)
        ? value
        : value && typeof value === 'object' && Array.isArray((value as { items?: unknown }).items)
            ? (value as { items: unknown[] }).items
            : [];
    const seen = new Set<string>();
    const result: ProjectCategoryRecord[] = [];
    items.forEach((item, index) => {
        const normalized = normalizeItem(item, index);
        if (!normalized) return;
        if (seen.has(normalized.slug)) return;
        seen.add(normalized.slug);
        result.push(normalized);
    });
    return result.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

async function loadStored() {
    const page = await prisma.page.findUnique({
        where: { slug: PROJECT_CATEGORIES_CONFIG_SLUG },
        select: { content: true },
    }).catch(() => null);
    return normalizeProjectCategoryRecords(page?.content);
}

async function persist(items: ProjectCategoryRecord[]) {
    const content = { items: normalizeProjectCategoryRecords(items) };
    await prisma.page.upsert({
        where: { slug: PROJECT_CATEGORIES_CONFIG_SLUG },
        create: {
            slug: PROJECT_CATEGORIES_CONFIG_SLUG,
            title: 'Project categories configuration',
            status: 'DRAFT',
            content,
        },
        update: { content },
    });
    return content.items;
}

export async function listProjectCategories() {
    const stored = await loadStored();
    const used = await prisma.project.groupBy({
        by: ['category'],
        where: { category: { not: null } },
        _count: { _all: true },
    }).catch(() => [] as Array<{ category: string | null; _count: { _all: number } }>);

    const counts = new Map<string, number>();
    used.forEach((row) => {
        const name = String(row.category ?? '').trim();
        if (name) counts.set(name, row._count._all);
    });

    const knownNames = new Set(stored.map((item) => item.name));
    const extras = [...counts.keys()]
        .filter((name) => !knownNames.has(name))
        .map((name, index) => ({
            id: slugifyProjectCategory(name),
            name,
            slug: slugifyProjectCategory(name),
            description: '',
            sortOrder: 1000 + index,
            isActive: true,
        }));

    const items = extras.length ? await persist([...stored, ...extras]) : stored;
    return items.map((item) => ({ ...item, usageCount: counts.get(item.name) ?? 0 }));
}

export async function getProjectCategoryNames() {
    const items = await listProjectCategories();
    return items.filter((item) => item.isActive).map((item) => item.name);
}

export async function ensureProjectCategory(name: string | null | undefined) {
    const trimmed = String(name ?? '').trim();
    if (!trimmed) return;
    const items = await listProjectCategories();
    if (items.some((item) => item.name.toLowerCase() === trimmed.toLowerCase())) return;
    await persist([...items, {
        id: slugifyProjectCategory(trimmed),
        name: trimmed,
        slug: slugifyProjectCategory(trimmed),
        description: '',
        sortOrder: (items.at(-1)?.sortOrder ?? 90) + 10,
        isActive: true,
    }]);
}

export async function createProjectCategoryRecord(input: { name: string; slug: string; description?: string; sortOrder: number; isActive: boolean }) {
    const items = await listProjectCategories();
    if (items.some((item) => item.slug === input.slug || item.name.toLowerCase() === input.name.toLowerCase())) {
        throw new Error('A project category with this name or slug already exists.');
    }
    await persist([...items, {
        id: input.slug,
        name: input.name,
        slug: input.slug,
        description: input.description ?? '',
        sortOrder: input.sortOrder,
        isActive: input.isActive,
    }]);
}

export async function updateProjectCategoryRecord(id: string, input: { name: string; slug: string; description?: string; sortOrder: number; isActive: boolean }) {
    const items = await listProjectCategories();
    const current = items.find((item) => item.id === id || item.slug === id);
    if (!current) throw new Error('Project category not found.');
    if (items.some((item) => item.id !== current.id && (item.slug === input.slug || item.name.toLowerCase() === input.name.toLowerCase()))) {
        throw new Error('A project category with this name or slug already exists.');
    }
    const next = items.map((item) => item.id === current.id
        ? { ...item, name: input.name, slug: input.slug, description: input.description ?? '', sortOrder: input.sortOrder, isActive: input.isActive }
        : item);
    if (current.name !== input.name) {
        await prisma.project.updateMany({ where: { category: current.name }, data: { category: input.name } });
    }
    await persist(next);
}

export async function deleteProjectCategoryRecord(id: string) {
    const items = await listProjectCategories();
    const current = items.find((item) => item.id === id || item.slug === id);
    if (!current) throw new Error('Project category not found.');
    const usage = await prisma.project.count({ where: { category: current.name } });
    if (usage) throw new Error(`This category is used by ${usage} project(s). Reassign them before deleting it.`);
    await persist(items.filter((item) => item.id !== current.id));
}
