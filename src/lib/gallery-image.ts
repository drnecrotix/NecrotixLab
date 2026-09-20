export const galleryImageWidths = [320, 640, 960, 1280, 1920, 2560] as const;

export function galleryImageWidth(value: number) {
    return galleryImageWidths.find((width) => width >= value) ?? 2560;
}

export function galleryImageUrl(src: string, width: number) {
    if (!src.startsWith('/api/protected-media/')) return src;
    const url = new URL(src, 'https://media.invalid');
    url.searchParams.set('w', String(galleryImageWidth(width)));
    return `${url.pathname}${url.search}`;
}
