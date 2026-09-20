export const SERVICE_TOOLS_CONFIG_SLUG = '__service-tools-config';

export const SERVICE_TOOL_ICONS = [
    'heart-pulse', 'accessibility', 'search-code', 'route', 'shield-check', 'globe',
    'drafting-compass', 'file-code', 'blocks', 'scan-search', 'binary', 'wrench',
] as const;

export type ServiceToolIcon = typeof SERVICE_TOOL_ICONS[number];

export type ServiceTool = {
    id: string;
    name: string;
    href: string;
    icon: ServiceToolIcon;
    enabled: boolean;
    visible: boolean;
    comingSoon: boolean;
};

export const DEFAULT_SERVICE_TOOLS: ServiceTool[] = [
    { id: 'website-inspector', name: 'Website Inspector', href: '/services/website-inspector', icon: 'heart-pulse', enabled: true, visible: true, comingSoon: false },
    { id: 'accessibility', name: 'Accessibility', href: '/accessibility-check', icon: 'accessibility', enabled: true, visible: true, comingSoon: false },
    { id: 'seo-intelligence', name: 'SEO Intelligence', href: '/seo-intelligence', icon: 'search-code', enabled: true, visible: true, comingSoon: false },
    { id: 'broken-links', name: 'Broken Links', href: '/site-crawl', icon: 'route', enabled: true, visible: true, comingSoon: false },
    { id: 'email-security', name: 'Email Security', href: '/email-domain-security', icon: 'shield-check', enabled: true, visible: true, comingSoon: false },
    { id: 'whois', name: 'WHOIS Lookup', href: '/tools/whois', icon: 'globe', enabled: false, visible: true, comingSoon: true },
    { id: 'dxf-inspector', name: 'DXF Inspector', href: '/tools/dxf-inspector', icon: 'drafting-compass', enabled: false, visible: true, comingSoon: true },
    { id: 'gcode-viewer', name: 'G-code Viewer', href: '/tools/gcode-viewer', icon: 'file-code', enabled: false, visible: true, comingSoon: true },
    { id: 'dxf-to-gcode', name: 'DXF to G-code', href: '/tools/dxf-to-gcode', icon: 'blocks', enabled: false, visible: true, comingSoon: true },
    { id: 'svg-to-gcode', name: 'SVG to G-code', href: '/tools/svg-to-gcode', icon: 'scan-search', enabled: false, visible: true, comingSoon: true },
    { id: 'gerber-to-gcode', name: 'Gerber to G-code', href: '/tools/gerber-to-gcode', icon: 'binary', enabled: false, visible: true, comingSoon: true },
];

const iconSet = new Set<string>(SERVICE_TOOL_ICONS);

function text(value: unknown, fallback: string, max: number) {
    const normalized = typeof value === 'string' ? value.trim() : '';
    return (normalized || fallback).slice(0, max);
}

export function normalizeServiceTools(value: unknown): ServiceTool[] {
    if (!Array.isArray(value)) return DEFAULT_SERVICE_TOOLS.map((tool) => ({ ...tool }));
    const seen = new Set<string>();
    return value.slice(0, 48).flatMap((entry, index) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
        const source = entry as Partial<ServiceTool>;
        let id = text(source.id, `tool-${index + 1}`, 64).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
        if (!id) id = `tool-${index + 1}`;
        if (seen.has(id)) id = `${id}-${index + 1}`;
        seen.add(id);
        const rawHref = text(source.href, '', 240);
        const href = rawHref.startsWith('/') && !rawHref.startsWith('//') ? rawHref : '';
        return [{
            id,
            name: text(source.name, `Tool ${index + 1}`, 80),
            href,
            icon: iconSet.has(String(source.icon)) ? source.icon as ServiceToolIcon : 'wrench',
            enabled: source.enabled === true,
            visible: source.visible !== false,
            comingSoon: source.comingSoon === true,
        }];
    });
}
