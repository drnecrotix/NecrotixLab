export function shouldBypassImageOptimizer(src: string | null | undefined) {
    if (!src) return false;

    try {
        const url = new URL(src, 'https://local.invalid');
        return url.pathname.includes('/api/protected-media/') || url.search.length > 0;
    } catch {
        return src.includes('/api/protected-media/') || src.includes('?');
    }
}
