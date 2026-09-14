import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        id: '/',
        name: 'NecrotixLab',
        short_name: 'NecrotixLab',
        description: 'Journal, projects and tools by dr.necrotix.',
        start_url: '/blog',
        scope: '/',
        display: 'standalone',
        background_color: '#0c0a12',
        theme_color: '#0c0a12',
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
    };
}
