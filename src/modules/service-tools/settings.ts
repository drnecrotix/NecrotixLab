export const SERVICE_TOOLS_CONFIG_SLUG = '__service-tools-config';

import { isSupportedIcon, SUPPORTED_ICON_NAMES, type SupportedIconName } from '@/lib/icon-library';

export const SERVICE_TOOL_ICONS = SUPPORTED_ICON_NAMES;
export type ServiceToolIcon = SupportedIconName;

export type ServiceTool = {
    id: string;
    name: string;
    href: string;
    icon: ServiceToolIcon;
    enabled: boolean;
    visible: boolean;
    comingSoon: boolean;
};

export const SERVICE_TOOLS_CONFIG_VERSION = 7;

const CORE_SERVICE_TOOLS: ServiceTool[] = [
    { id: 'website-inspector', name: 'Website Inspector', href: '/services/website-inspector', icon: 'heart-pulse', enabled: true, visible: true, comingSoon: false },
    { id: 'accessibility', name: 'Accessibility', href: '/accessibility-check', icon: 'accessibility', enabled: true, visible: true, comingSoon: false },
    { id: 'seo-intelligence', name: 'SEO Intelligence', href: '/seo-intelligence', icon: 'search-code', enabled: true, visible: true, comingSoon: false },
    { id: 'broken-links', name: 'Broken Links', href: '/site-crawl', icon: 'route', enabled: true, visible: true, comingSoon: false },
    { id: 'email-security', name: 'Email Security', href: '/email-domain-security', icon: 'shield-check', enabled: true, visible: true, comingSoon: false },
    { id: 'whois', name: 'WHOIS Lookup', href: '/tools/whois', icon: 'globe', enabled: true, visible: true, comingSoon: false },
    { id: 'discord-lookup', name: 'Discord Lookup', href: '/tools/discord-lookup', icon: 'message-circle', enabled: true, visible: true, comingSoon: false },
    { id: 'document-converter', name: 'Document Formats', href: '/tools/document-converter', icon: 'file-text', enabled: false, visible: true, comingSoon: true },
    { id: 'image-converter', name: 'Image Formats', href: '/tools/image-converter', icon: 'image', enabled: false, visible: true, comingSoon: true },
    { id: 'social-video', name: 'Video Download', href: '/tools/video-download', icon: 'video', enabled: true, visible: true, comingSoon: false },
    { id: 'pdf-file-check', name: 'PDF File Check', href: '/tools/pdf-file-check', icon: 'file-check', enabled: false, visible: true, comingSoon: true },
    { id: 'url-scam-check', name: 'URL Scam Check', href: '/tools/url-scam-check', icon: 'shield-alert', enabled: false, visible: true, comingSoon: true },
    { id: 'dxf-inspector', name: 'DXF Inspector', href: '/tools/dxf-inspector', icon: 'drafting-compass', enabled: true, visible: true, comingSoon: false },
    { id: 'gcode-viewer', name: 'G-code Viewer', href: '/tools/gcode-viewer', icon: 'file-code', enabled: false, visible: true, comingSoon: true },
    { id: 'dxf-to-gcode', name: 'DXF to G-code', href: '/tools/dxf-to-gcode', icon: 'blocks', enabled: false, visible: true, comingSoon: true },
    { id: 'svg-to-gcode', name: 'SVG to G-code', href: '/tools/svg-to-gcode', icon: 'scan-search', enabled: true, visible: true, comingSoon: false },
    { id: 'gerber-to-gcode', name: 'Gerber to G-code', href: '/tools/gerber-to-gcode', icon: 'binary', enabled: false, visible: true, comingSoon: true },
];

export const DOCUMENT_AND_BINARY_TOOLS: ServiceTool[] = [
    { id: 'merge-pdf', name: 'Merge PDF', href: '/tools/merge-pdf', icon: 'combine', enabled: false, visible: true, comingSoon: true },
    { id: 'split-pdf', name: 'Split PDF', href: '/tools/split-pdf', icon: 'scissors', enabled: false, visible: true, comingSoon: true },
    { id: 'organize-pdf', name: 'Organize PDF', href: '/tools/organize-pdf', icon: 'list-ordered', enabled: false, visible: true, comingSoon: true },
    { id: 'compress-pdf', name: 'Compress PDF', href: '/tools/compress-pdf', icon: 'shrink', enabled: false, visible: true, comingSoon: true },
    { id: 'images-to-pdf', name: 'Images to PDF', href: '/tools/images-to-pdf', icon: 'image-plus', enabled: false, visible: true, comingSoon: true },
    { id: 'pdf-to-images', name: 'PDF to Images', href: '/tools/pdf-to-images', icon: 'file-image', enabled: false, visible: true, comingSoon: true },
    { id: 'sign-pdf', name: 'Sign PDF', href: '/tools/sign-pdf', icon: 'pen-line', enabled: false, visible: true, comingSoon: true },
    { id: 'watermark-pdf', name: 'PDF Watermark', href: '/tools/watermark-pdf', icon: 'stamp', enabled: false, visible: true, comingSoon: true },
    { id: 'document-inspector', name: 'Document Inspector & Privacy Cleaner', href: '/tools/document-inspector', icon: 'file-scan', enabled: true, visible: true, comingSoon: false },
    { id: 'exif-tool', name: 'EXIF Tool', href: '/tools/exif-tool', icon: 'camera', enabled: true, visible: true, comingSoon: false },
    { id: 'compare-documents', name: 'Compare Documents', href: '/tools/compare-documents', icon: 'file-diff', enabled: false, visible: true, comingSoon: true },
    { id: 'binary-converter', name: 'Binary Converter', href: '/tools/binary-converter', icon: 'binary', enabled: true, visible: true, comingSoon: false },
    { id: 'base64-codec', name: 'Base64 Encode / Decode', href: '/tools/base64', icon: 'braces', enabled: true, visible: true, comingSoon: false },
    { id: 'file-hash', name: 'File Hash', href: '/tools/file-hash', icon: 'fingerprint', enabled: true, visible: true, comingSoon: false },
    { id: 'hex-viewer', name: 'Hex Viewer', href: '/tools/hex-viewer', icon: 'file-json', enabled: true, visible: true, comingSoon: false },
];

export const WEB_UTILITY_TOOLS: ServiceTool[] = [
    { id: 'text-toolkit', name: 'Text Toolkit', href: '/tools/text-toolkit', icon: 'text-cursor-input', enabled: true, visible: true, comingSoon: false },
    { id: 'image-toolkit', name: 'Image Toolkit', href: '/tools/image-toolkit', icon: 'image-plus', enabled: true, visible: true, comingSoon: false },
    { id: 'calculator-toolkit', name: 'Quick Calculators', href: '/tools/calculators', icon: 'calculator', enabled: true, visible: true, comingSoon: false },
    { id: 'unit-converter', name: 'Unit Converter', href: '/tools/unit-converter', icon: 'ruler', enabled: true, visible: true, comingSoon: false },
    { id: 'web-encoder', name: 'URL & HTML Encoder', href: '/tools/web-encoder', icon: 'code-2', enabled: true, visible: true, comingSoon: false },
    { id: 'json-toolkit', name: 'JSON Toolkit', href: '/tools/json-toolkit', icon: 'braces', enabled: true, visible: true, comingSoon: false },
    { id: 'url-toolkit', name: 'URL Parser & UTM', href: '/tools/url-toolkit', icon: 'link', enabled: true, visible: true, comingSoon: false },
    { id: 'uuid-generator', name: 'UUID Generator', href: '/tools/uuid-generator', icon: 'hash', enabled: true, visible: true, comingSoon: false },
    { id: 'password-generator', name: 'Password Generator', href: '/tools/password-generator', icon: 'key-round', enabled: true, visible: true, comingSoon: false },
    { id: 'color-converter', name: 'Color Converter', href: '/tools/color-converter', icon: 'palette', enabled: true, visible: true, comingSoon: false },
    { id: 'subtitle-converter', name: 'VTT / SRT Converter', href: '/tools/subtitle-converter', icon: 'subtitles', enabled: true, visible: true, comingSoon: false },
];

export const ENGINEERING_TOOLS: ServiceTool[] = [
    { id: 'gcode-editor', name: 'G-Code Editor', href: '/tools/gcode-editor', icon: 'file-pen-line', enabled: true, visible: true, comingSoon: false },
];

export const DEFAULT_SERVICE_TOOLS: ServiceTool[] = [
    ...CORE_SERVICE_TOOLS,
    ...DOCUMENT_AND_BINARY_TOOLS,
    ...WEB_UTILITY_TOOLS,
    ...ENGINEERING_TOOLS,
];

type ServiceToolsConfig = {
    version: number;
    tools: ServiceTool[];
};

function normalizeEntries(value: unknown): ServiceTool[] {
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    return value.slice(0, 64).flatMap((entry, index) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
        const source = entry as Partial<ServiceTool>;
        let id = text(source.id, `tool-${index + 1}`, 64).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
        if (!id) id = `tool-${index + 1}`;
        if (seen.has(id)) id = `${id}-${index + 1}`;
        seen.add(id);
        const rawHref = text(source.href, '', 240);
        const href = rawHref.startsWith('/') && !rawHref.startsWith('//') ? rawHref : '';
        return [{ id, name: text(source.name, `Tool ${index + 1}`, 80), href, icon: isSupportedIcon(source.icon) ? source.icon : 'wrench', enabled: source.enabled === true, visible: source.visible !== false, comingSoon: source.comingSoon === true }];
    });
}

export function normalizeServiceToolsConfig(value: unknown): ServiceToolsConfig {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value as { version?: unknown; tools?: unknown } : null;
    const version = typeof source?.version === 'number' ? source.version : Array.isArray(value) ? 1 : 0;
    const configured = normalizeEntries(source?.tools ?? value);
    if (!configured.length && version === 0) return { version: SERVICE_TOOLS_CONFIG_VERSION, tools: DEFAULT_SERVICE_TOOLS.map((tool) => ({ ...tool })) };

    const tools = [...configured];
    if (version < SERVICE_TOOLS_CONFIG_VERSION) {
        const existing = new Set(tools.map((tool) => tool.id));
        const additions = version < 2
            ? [...DOCUMENT_AND_BINARY_TOOLS, ...WEB_UTILITY_TOOLS, ...ENGINEERING_TOOLS]
            : version < 3
                ? [...WEB_UTILITY_TOOLS, ...ENGINEERING_TOOLS]
                : ENGINEERING_TOOLS;
        for (const tool of additions) if (!existing.has(tool.id)) tools.push({ ...tool });
        if (version < 7) for (const id of ['discord-lookup', 'exif-tool']) {
            if (existing.has(id)) continue;
            const definition = [...CORE_SERVICE_TOOLS, ...DOCUMENT_AND_BINARY_TOOLS].find((item) => item.id === id);
            if (definition) tools.push({ ...definition });
        }
        // Preserve administrator visibility choices while activating newly implemented routes.
        for (const id of ['whois', 'dxf-inspector', 'svg-to-gcode', 'social-video']) {
            const tool = tools.find((item) => item.id === id);
            if (tool && tool.comingSoon) { tool.comingSoon = false; tool.enabled = true; }
            if (tool && id === 'social-video') { tool.name = 'Video Download'; tool.href = '/tools/video-download'; }
            if (!tool) { const definition = CORE_SERVICE_TOOLS.find((item) => item.id === id); if (definition) tools.push({ ...definition }); }
        }
    }
    return { version: SERVICE_TOOLS_CONFIG_VERSION, tools };
}

function text(value: unknown, fallback: string, max: number) {
    const normalized = typeof value === 'string' ? value.trim() : '';
    return (normalized || fallback).slice(0, max);
}

export function normalizeServiceTools(value: unknown): ServiceTool[] {
    return normalizeServiceToolsConfig(value).tools;
}
