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

export const PWA_CATEGORIES = [
    'portfolio',
    'productivity',
    'utilities',
    'lifestyle',
    'news',
    'education',
    'entertainment',
    'social',
] as const;

export type PwaTabIcon = (typeof PWA_TAB_ICONS)[number];
export type PwaCategory = (typeof PWA_CATEGORIES)[number];
export type PwaDisplayMode = 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
export type PwaOrientation = 'any' | 'portrait' | 'landscape';
export type PwaStatusBarStyle = 'default' | 'black' | 'black-translucent';
export type PwaTabBarStyle = 'docked' | 'floating';
export type PwaHandleLinks = 'auto' | 'preferred' | 'not-preferred';
export type PwaLaunchHandler = 'auto' | 'navigate-existing' | 'navigate-new' | 'focus-existing';

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
    id: string;
    lang: string;
    display: PwaDisplayMode;
    orientation: PwaOrientation;
    backgroundColor: string;
    themeColor: string;
    themeColorLight: string;
    iconUrl: string;
    icon192Url: string;
    icon512Url: string;
    appleIconUrl: string;
    maskableIconUrl: string;
    screenshotNarrowUrl: string;
    screenshotWideUrl: string;
    categories: PwaCategory[];
    handleLinks: PwaHandleLinks;
    launchHandler: PwaLaunchHandler;
    displayOverrideWco: boolean;
    shareTargetEnabled: boolean;
    statusBarStyle: PwaStatusBarStyle;
    nativeChrome: boolean;
    tabBarStyle: PwaTabBarStyle;
    hideSiteChrome: boolean;
    showInstallPrompt: boolean;
    showIosInstallHint: boolean;
    splashEnabled: boolean;
    serviceWorkerEnabled: boolean;
    offlineFallbackEnabled: boolean;
    pullToRefresh: boolean;
    updatePromptEnabled: boolean;
    offlineBannerEnabled: boolean;
    tabs: PwaTabItem[];
    shortcuts: PwaShortcut[];
};

export const defaultPwaSettings: PwaSettings = {
    name: 'NecrotixLab',
    shortName: 'NecrotixLab',
    description: 'Journal, projects and tools by dr.necrotix.',
    startUrl: '/blog',
    scope: '/',
    id: '/',
    lang: 'en',
    display: 'standalone',
    orientation: 'any',
    backgroundColor: '#0c0a12',
    themeColor: '#0c0a12',
    themeColorLight: '#ffffff',
    iconUrl: '/favicon.svg',
    icon192Url: '',
    icon512Url: '',
    appleIconUrl: '/favicon.svg',
    maskableIconUrl: '',
    screenshotNarrowUrl: '',
    screenshotWideUrl: '',
    categories: ['portfolio', 'productivity'],
    handleLinks: 'preferred',
    launchHandler: 'navigate-existing',
    displayOverrideWco: false,
    shareTargetEnabled: false,
    statusBarStyle: 'default',
    nativeChrome: true,
    tabBarStyle: 'docked',
    hideSiteChrome: true,
    showInstallPrompt: false,
    showIosInstallHint: false,
    splashEnabled: true,
    serviceWorkerEnabled: false,
    offlineFallbackEnabled: false,
    pullToRefresh: true,
    updatePromptEnabled: true,
    offlineBannerEnabled: true,
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

function categoriesFrom(value: unknown): PwaCategory[] {
    const source = Array.isArray(value) ? value : defaultPwaSettings.categories;
    const next = source
        .filter((item): item is PwaCategory => typeof item === 'string' && (PWA_CATEGORIES as readonly string[]).includes(item));
    return next.length ? [...new Set(next)].slice(0, 5) : [...defaultPwaSettings.categories];
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
    const handleLinks = source.handleLinks === 'preferred' || source.handleLinks === 'not-preferred' || source.handleLinks === 'auto'
        ? source.handleLinks
        : defaultPwaSettings.handleLinks;
    const launchHandler = source.launchHandler === 'navigate-existing' || source.launchHandler === 'navigate-new' || source.launchHandler === 'focus-existing' || source.launchHandler === 'auto'
        ? source.launchHandler
        : defaultPwaSettings.launchHandler;

    const tabs = tabsSource.slice(0, 5).map((item, index) => (
        normalizePwaTab(item, defaultPwaSettings.tabs[index] ?? defaultPwaSettings.tabs[0], index)
    ));
    while (tabs.length < defaultPwaSettings.tabs.length) {
        tabs.push(defaultPwaSettings.tabs[tabs.length]);
    }

    const lang = text(source.lang, defaultPwaSettings.lang, 8).toLowerCase();

    return {
        name: text(source.name, defaultPwaSettings.name, 60),
        shortName: text(source.shortName, defaultPwaSettings.shortName, 20),
        description: text(source.description, defaultPwaSettings.description, 180),
        startUrl: pathValue(source.startUrl, defaultPwaSettings.startUrl),
        scope: pathValue(source.scope, defaultPwaSettings.scope),
        id: pathValue(source.id, defaultPwaSettings.id),
        lang: /^[a-z]{2}(-[a-z]{2})?$/.test(lang) ? lang : defaultPwaSettings.lang,
        display,
        orientation,
        backgroundColor: hexColor(source.backgroundColor, defaultPwaSettings.backgroundColor),
        themeColor: hexColor(source.themeColor, defaultPwaSettings.themeColor),
        themeColorLight: hexColor(source.themeColorLight, defaultPwaSettings.themeColorLight),
        iconUrl: mediaUrl(source.iconUrl, defaultPwaSettings.iconUrl),
        icon192Url: mediaUrl(source.icon192Url, ''),
        icon512Url: mediaUrl(source.icon512Url, ''),
        appleIconUrl: mediaUrl(source.appleIconUrl, defaultPwaSettings.appleIconUrl),
        maskableIconUrl: mediaUrl(source.maskableIconUrl, ''),
        screenshotNarrowUrl: mediaUrl(source.screenshotNarrowUrl, ''),
        screenshotWideUrl: mediaUrl(source.screenshotWideUrl, ''),
        categories: categoriesFrom(source.categories),
        handleLinks,
        launchHandler,
        displayOverrideWco: bool(source.displayOverrideWco, defaultPwaSettings.displayOverrideWco),
        shareTargetEnabled: bool(source.shareTargetEnabled, defaultPwaSettings.shareTargetEnabled),
        statusBarStyle,
        nativeChrome: bool(source.nativeChrome, defaultPwaSettings.nativeChrome),
        tabBarStyle: source.tabBarStyle === 'floating' ? 'floating' : 'docked',
        hideSiteChrome: bool(source.hideSiteChrome, defaultPwaSettings.hideSiteChrome),
        showInstallPrompt: bool(source.showInstallPrompt, defaultPwaSettings.showInstallPrompt),
        showIosInstallHint: bool(source.showIosInstallHint, defaultPwaSettings.showIosInstallHint),
        splashEnabled: bool(source.splashEnabled, defaultPwaSettings.splashEnabled),
        serviceWorkerEnabled: bool(source.serviceWorkerEnabled, defaultPwaSettings.serviceWorkerEnabled),
        offlineFallbackEnabled: bool(source.offlineFallbackEnabled, defaultPwaSettings.offlineFallbackEnabled),
        pullToRefresh: bool(source.pullToRefresh, defaultPwaSettings.pullToRefresh),
        updatePromptEnabled: bool(source.updatePromptEnabled, defaultPwaSettings.updatePromptEnabled),
        offlineBannerEnabled: bool(source.offlineBannerEnabled, defaultPwaSettings.offlineBannerEnabled),
        tabs,
        shortcuts: shortcutsSource.slice(0, 4).map((item, index) => (
            normalizePwaShortcut(item, defaultPwaSettings.shortcuts[index] ?? { name: '', url: '/', description: '' })
        )).filter((item) => item.name && item.url),
    };
}

export function enabledPwaTabs(settings: PwaSettings) {
    return settings.tabs.filter((tab) => tab.enabled && tab.label && tab.href).slice(0, 5);
}

function iconType(src: string) {
    if (src.endsWith('.svg')) return 'image/svg+xml';
    if (src.endsWith('.webp')) return 'image/webp';
    return 'image/png';
}

export function pwaSettingsToManifest(settings: PwaSettings = defaultPwaSettings) {
    const icons: Array<{ src: string; sizes: string; type: string; purpose: 'any' | 'maskable' }> = [];
    if (settings.icon192Url) {
        icons.push({ src: settings.icon192Url, sizes: '192x192', type: iconType(settings.icon192Url), purpose: 'any' });
    }
    if (settings.icon512Url) {
        icons.push({ src: settings.icon512Url, sizes: '512x512', type: iconType(settings.icon512Url), purpose: 'any' });
    }
    icons.push({
        src: settings.iconUrl || defaultPwaSettings.iconUrl,
        sizes: 'any',
        type: iconType(settings.iconUrl || defaultPwaSettings.iconUrl),
        purpose: 'any',
    });
    if (settings.maskableIconUrl) {
        icons.push({ src: settings.maskableIconUrl, sizes: '512x512', type: iconType(settings.maskableIconUrl), purpose: 'maskable' });
    }

    const screenshots: Array<{ src: string; sizes: string; type: string; form_factor: 'narrow' | 'wide'; label: string }> = [];
    if (settings.screenshotNarrowUrl) {
        screenshots.push({
            src: settings.screenshotNarrowUrl,
            sizes: '390x844',
            type: iconType(settings.screenshotNarrowUrl),
            form_factor: 'narrow',
            label: `${settings.shortName} on phone`,
        });
    }
    if (settings.screenshotWideUrl) {
        screenshots.push({
            src: settings.screenshotWideUrl,
            sizes: '1280x720',
            type: iconType(settings.screenshotWideUrl),
            form_factor: 'wide',
            label: `${settings.shortName} on desktop`,
        });
    }

    const manifest: Record<string, unknown> = {
        id: settings.id,
        name: settings.name,
        short_name: settings.shortName,
        description: settings.description,
        start_url: settings.startUrl,
        scope: settings.scope,
        display: settings.display,
        display_override: settings.displayOverrideWco
            ? ['window-controls-overlay', settings.display]
            : [settings.display],
        orientation: settings.orientation,
        background_color: settings.backgroundColor,
        theme_color: settings.themeColor,
        lang: settings.lang,
        dir: 'ltr',
        categories: settings.categories,
        handle_links: settings.handleLinks,
        launch_handler: { client_mode: settings.launchHandler },
        icons,
        shortcuts: settings.shortcuts.map((item) => ({
            name: item.name,
            short_name: item.name,
            description: item.description,
            url: item.url,
        })),
    };

    if (screenshots.length) manifest.screenshots = screenshots;
    if (settings.shareTargetEnabled) {
        manifest.share_target = {
            action: '/contact',
            method: 'GET',
            enctype: 'application/x-www-form-urlencoded',
            params: { title: 'title', text: 'text', url: 'url' },
        };
    }

    return manifest;
}
