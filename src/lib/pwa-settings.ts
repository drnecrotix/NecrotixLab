export const PWA_CONFIG_SLUG = '__pwa-config';

export const PWA_TAB_ICONS = [
    'home',
    'journal',
    'projects',
    'gallery',
    'lab',
    'contact',
    'store',
    'more',
    'user',
    'compass',
    'sparkles',
    'map',
    'settings',
] as const;

export type PwaTabIcon = (typeof PWA_TAB_ICONS)[number];
export type PwaDisplayMode = 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
export type PwaOrientation = 'any' | 'portrait' | 'landscape';
export type PwaStatusBarStyle = 'default' | 'black' | 'black-translucent';
export type PwaTabBarStyle = 'docked' | 'floating';

export type PwaTabItem = {
    id: string;
    label: string;
    href: string;
    icon: PwaTabIcon;
    enabled: boolean;
};

export type PwaShortcut = {
    name: string;
    url: string;
    description: string;
};

export type PwaSettings = {
    name: string;
    shortName: string;
    description: string;
    startUrl: string;
    scope: string;
    display: PwaDisplayMode;
    orientation: PwaOrientation;
    backgroundColor: string;
    themeColor: string;
    themeColorLight: string;
    iconUrl: string;
    appleIconUrl: string;
    maskableIconUrl: string;
    statusBarStyle: PwaStatusBarStyle;
    nativeChrome: boolean;
    tabBarStyle: PwaTabBarStyle;
    hideSiteChrome: boolean;
    showInstallPrompt: boolean;
    showIosInstallHint: boolean;
    splashEnabled: boolean;
    tabs: PwaTabItem[];
    shortcuts: PwaShortcut[];
};

export const defaultPwaSettings: PwaSettings = {
    name: 'NecrotixLab',
    shortName: 'NecrotixLab',
    description: 'Journal, projects and tools by dr.necrotix.',
    startUrl: '/blog',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    backgroundColor: '#0c0a12',
    themeColor: '#0c0a12',
    themeColorLight: '#ffffff',
    iconUrl: '/favicon.svg',
    appleIconUrl: '/favicon.svg',
    maskableIconUrl: '',
    statusBarStyle: 'default',
    nativeChrome: true,
    tabBarStyle: 'docked',
    hideSiteChrome: true,
    showInstallPrompt: false,
    showIosInstallHint: false,
    splashEnabled: true,
    tabs: [
        { id: 'home', label: 'Home', href: '/', icon: 'home', enabled: true },
        { id: 'journal', label: 'Journal', href: '/blog', icon: 'journal', enabled: true },
        { id: 'projects', label: 'Projects', href: '/projects', icon: 'projects', enabled: true },
        { id: 'gallery', label: 'Gallery', href: '/gallery', icon: 'gallery', enabled: true },
        { id: 'more', label: 'More', href: '/contact', icon: 'more', enabled: true },
    ],
    shortcuts: [
        { name: 'Journal', url: '/blog', description: 'Open the journal' },
        { name: 'Projects', url: '/projects', description: 'Open projects' },
    ],
};

function object(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function bool(value: unknown, fallback: boolean) {
    return typeof value === 'boolean' ? value : fallback;
}

function text(value: unknown, fallback: string, max = 180) {
    if (typeof value !== 'string') return fallback;
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, max) : fallback;
}

function hexColor(value: unknown, fallback: string) {
    return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : fallback;
}

function pathValue(value: unknown, fallback: string) {
    const raw = text(value, fallback, 2048);
    if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
    return fallback;
}

function mediaUrl(value: unknown, fallback: string) {
    const raw = typeof value === 'string' ? value.trim() : '';
    if (!raw) return fallback;
    if (raw.startsWith('/') && !raw.startsWith('//')) return raw.slice(0, 2048);
    try {
        const parsed = new URL(raw);
        return parsed.protocol === 'https:' ? parsed.toString().slice(0, 2048) : fallback;
    } catch {
        return fallback;
    }
}

function iconName(value: unknown, fallback: PwaTabIcon): PwaTabIcon {
    return typeof value === 'string' && (PWA_TAB_ICONS as readonly string[]).includes(value)
        ? value as PwaTabIcon
        : fallback;
}

function tabId(value: unknown, fallback: string) {
    const raw = text(value, fallback, 40).toLowerCase().replace(/[^a-z0-9-]/g, '');
    return raw || fallback;
}

export function normalizePwaTab(value: unknown, fallback: PwaTabItem, index: number): PwaTabItem {
    const source = object(value);
    return {
        id: tabId(source.id, fallback.id || `tab-${index + 1}`),
        label: text(source.label, fallback.label, 24),
        href: pathValue(source.href, fallback.href),
        icon: iconName(source.icon, fallback.icon),
        enabled: bool(source.enabled, fallback.enabled),
    };
}

export function normalizePwaShortcut(value: unknown, fallback: PwaShortcut): PwaShortcut {
    const source = object(value);
    return {
        name: text(source.name, fallback.name, 40),
        url: pathValue(source.url, fallback.url),
        description: text(source.description, fallback.description, 80),
    };
}

export function normalizePwaSettings(value: unknown): PwaSettings {
    const source = object(value);
    const tabsSource = Array.isArray(source.tabs) ? source.tabs : defaultPwaSettings.tabs;
    const shortcutsSource = Array.isArray(source.shortcuts) ? source.shortcuts : defaultPwaSettings.shortcuts;
    const display = source.display === 'fullscreen' || source.display === 'minimal-ui' || source.display === 'browser' || source.display === 'standalone'
        ? source.display
        : defaultPwaSettings.display;
    const orientation = source.orientation === 'portrait' || source.orientation === 'landscape' || source.orientation === 'any'
        ? source.orientation
        : defaultPwaSettings.orientation;
    const statusBarStyle = source.statusBarStyle === 'black' || source.statusBarStyle === 'black-translucent' || source.statusBarStyle === 'default'
        ? source.statusBarStyle
        : defaultPwaSettings.statusBarStyle;

    const tabs = tabsSource.slice(0, 5).map((item, index) => (
        normalizePwaTab(item, defaultPwaSettings.tabs[index] ?? defaultPwaSettings.tabs[0], index)
    ));
    while (tabs.length < defaultPwaSettings.tabs.length) {
        tabs.push(defaultPwaSettings.tabs[tabs.length]);
    }

    return {
        name: text(source.name, defaultPwaSettings.name, 60),
        shortName: text(source.shortName, defaultPwaSettings.shortName, 20),
        description: text(source.description, defaultPwaSettings.description, 180),
        startUrl: pathValue(source.startUrl, defaultPwaSettings.startUrl),
        scope: pathValue(source.scope, defaultPwaSettings.scope),
        display,
        orientation,
        backgroundColor: hexColor(source.backgroundColor, defaultPwaSettings.backgroundColor),
        themeColor: hexColor(source.themeColor, defaultPwaSettings.themeColor),
        themeColorLight: hexColor(source.themeColorLight, defaultPwaSettings.themeColorLight),
        iconUrl: mediaUrl(source.iconUrl, defaultPwaSettings.iconUrl),
        appleIconUrl: mediaUrl(source.appleIconUrl, defaultPwaSettings.appleIconUrl),
        maskableIconUrl: mediaUrl(source.maskableIconUrl, ''),
        statusBarStyle,
        nativeChrome: bool(source.nativeChrome, defaultPwaSettings.nativeChrome),
        tabBarStyle: source.tabBarStyle === 'floating' ? 'floating' : 'docked',
        hideSiteChrome: bool(source.hideSiteChrome, defaultPwaSettings.hideSiteChrome),
        showInstallPrompt: bool(source.showInstallPrompt, defaultPwaSettings.showInstallPrompt),
        showIosInstallHint: bool(source.showIosInstallHint, defaultPwaSettings.showIosInstallHint),
        splashEnabled: bool(source.splashEnabled, defaultPwaSettings.splashEnabled),
        tabs,
        shortcuts: shortcutsSource.slice(0, 4).map((item, index) => (
            normalizePwaShortcut(item, defaultPwaSettings.shortcuts[index] ?? { name: '', url: '/', description: '' })
        )).filter((item) => item.name && item.url),
    };
}

export function enabledPwaTabs(settings: PwaSettings) {
    return settings.tabs.filter((tab) => tab.enabled && tab.label && tab.href).slice(0, 5);
}

export function pwaSettingsToManifest(settings: PwaSettings = defaultPwaSettings) {
    const icons = [
        { src: settings.iconUrl || defaultPwaSettings.iconUrl, sizes: 'any', type: settings.iconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png', purpose: 'any' as const },
    ];
    if (settings.maskableIconUrl) {
        icons.push({ src: settings.maskableIconUrl, sizes: '512x512', type: 'image/png', purpose: 'maskable' as const });
    }

    return {
        id: '/',
        name: settings.name,
        short_name: settings.shortName,
        description: settings.description,
        start_url: settings.startUrl,
        scope: settings.scope,
        display: settings.display,
        orientation: settings.orientation,
        background_color: settings.backgroundColor,
        theme_color: settings.themeColor,
        lang: 'en',
        icons,
        shortcuts: settings.shortcuts.map((item) => ({
            name: item.name,
            short_name: item.name,
            description: item.description,
            url: item.url,
        })),
    };
}
