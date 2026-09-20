export const runtimeErrorKinds = ['javascript', 'promise', 'resource', 'request', 'render'] as const;
export type RuntimeErrorKind = typeof runtimeErrorKinds[number];

// Store route families, never query strings, user-entered values or account IDs.
export function diagnosticPath(value: unknown): string {
    if (typeof value !== 'string') return '/';
    try {
        const path = new URL(value, 'https://diagnostic.invalid').pathname;
        const segments = path.split('/').filter(Boolean);
        const safe = new Set(['api', 'admin', 'gallery', 'blog', 'projects', 'wiki', 'services', 'store', 'lab', 'tools', 'protected-media', 'uploads', '_next', 'static', 'image', 'contact', 'search', 'site-health', 'runtime-errors']);
        return '/' + segments.slice(0, 4).map((segment) => safe.has(segment) ? segment : '[item]').join('/');
    } catch { return '/'; }
}

export function diagnosticCode(value: unknown) {
    return typeof value === 'string' && /^[a-zA-Z0-9_.-]{1,80}$/.test(value) ? value : 'UnknownError';
}
