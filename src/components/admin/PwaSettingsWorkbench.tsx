'use client';

import { useMemo, useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
    Check,
    ChevronDown,
    ChevronUp,
    MonitorSmartphone,
    Palette,
    Save,
    Share,
    Smartphone,
    Sparkles,
} from 'lucide-react';
import { MediaPicker } from '@/components/admin/MediaPicker';
import { savePwaSettings } from '@/app/admin/(protected)/pwa/actions';
import {
    PWA_CATEGORIES,
    PWA_GENERATED_PACK,
    PWA_READER_THEMES,
    PWA_SPLASH_STYLES,
    PWA_TAB_ICONS,
    applyGeneratedIconPack,
    defaultPwaSettings,
    enabledPwaTabs,
    pwaSettingsToManifest,
    resolvedPwaIconUrls,
    type PwaCategory,
    type PwaDisplayMode,
    type PwaHandleLinks,
    type PwaLaunchHandler,
    type PwaOrientation,
    type PwaReaderTheme,
    type PwaSettings,
    type PwaShortcut,
    type PwaSplashStyle,
    type PwaStatusBarStyle,
    type PwaTabBarStyle,
    type PwaTabIcon,
    type PwaTabItem,
} from '@/lib/pwa-settings';

const field = 'mt-1.5 w-full rounded-xl border border-foreground/10 bg-foreground/[0.025] px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-sky-400/40 focus:bg-foreground/[0.04]';

type SectionId = 'identity' | 'chrome' | 'tabs' | 'manifest' | 'reading' | 'offline' | 'install';

const sections: Array<{ id: SectionId; label: string; hint: string }> = [
    { id: 'identity', label: 'App identity', hint: 'Name and one source logo' },
    { id: 'chrome', label: 'Native chrome', hint: 'Tab bar and status bar' },
    { id: 'tabs', label: 'Tab bar', hint: 'Installed app navigation' },
    { id: 'manifest', label: 'Manifest extras', hint: 'Screenshots, WCO, share' },
    { id: 'reading', label: 'Splash & reader', hint: 'Launch screen and journal reader' },
    { id: 'offline', label: 'Offline & updates', hint: 'Opt-in service worker' },
    { id: 'install', label: 'Install prompts', hint: 'Browser banners only if enabled' },
];

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (value: boolean) => void; label: string; hint: string }) {
    return (
        <label className="flex items-start justify-between gap-4 rounded-xl border border-foreground/10 bg-foreground/[0.02] px-4 py-3">
            <span>
                <span className="block text-sm font-semibold text-foreground">{label}</span>
                <span className="mt-1 block text-[11px] leading-5 text-muted-foreground">{hint}</span>
            </span>
            <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 size-4 accent-sky-500" />
        </label>
    );
}

function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
    return (
        <section>
            <div className="mb-5">
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{description}</p>
            </div>
            {children}
        </section>
    );
}

function PhonePreview({ settings }: { settings: PwaSettings }) {
    const tabs = enabledPwaTabs(settings);
    const pack = resolvedPwaIconUrls(settings);
    return (
        <aside className="overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.018]">
            <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
                <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-muted-foreground">Installed app preview</p>
                    <p className="mt-1 text-xs font-semibold">Does not change the public website</p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[9px] text-emerald-300">standalone</span>
            </div>
            <div className="p-5">
                <div className="mx-auto w-[230px] overflow-hidden rounded-[2rem] border border-foreground/15 bg-black shadow-2xl">
                    <div className="px-5 pt-3" style={{ background: settings.themeColor }}>
                        <div className="mx-auto h-1.5 w-16 rounded-full bg-white/25" />
                        <div className="flex items-center gap-2 py-3">
                            <img src={pack.icon180} alt="" className="size-6 rounded-md object-contain" />
                            <span className="truncate text-[11px] font-semibold text-white">{settings.shortName}</span>
                        </div>
                    </div>
                    <div className="relative min-h-[280px]" style={{ background: settings.backgroundColor }}>
                        <div className="px-4 pt-5">
                            <p className="text-[9px] uppercase tracking-[0.22em] text-white/30">Home screen</p>
                            <h4 className="mt-2 text-lg font-semibold tracking-tight text-white">{settings.name}</h4>
                            <p className="mt-2 line-clamp-3 text-[11px] leading-5 text-white/45">{settings.description}</p>
                            <p className="mt-3 text-[9px] uppercase tracking-[0.18em] text-white/25">
                                {settings.display} · SW {settings.serviceWorkerEnabled ? 'on' : 'off'}
                            </p>
                        </div>
                        {settings.nativeChrome ? (
                            <div className={`absolute inset-x-2 bottom-2 grid grid-flow-col auto-cols-fr gap-1 ${settings.tabBarStyle === 'floating' ? 'rounded-2xl border border-white/10 bg-white/8 p-1' : 'border-t border-white/10 pt-1'}`}>
                                {tabs.map((tab) => (
                                    <div key={tab.id} className="py-2 text-center text-[8px] text-white/70">
                                        <span className="mx-auto mb-1 block size-1.5 rounded-full bg-white/80" />
                                        {tab.label}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="absolute inset-x-4 bottom-4 text-center text-[10px] text-white/35">Website navigation stays visible in the installed app.</p>
                        )}
                    </div>
                </div>
                <p className="mt-4 text-[11px] leading-5 text-muted-foreground">
                    Start URL <span className="font-mono text-foreground/70">{settings.startUrl}</span>. Browser visitors still see the existing site.
                </p>
            </div>
        </aside>
    );
}

export function PwaSettingsWorkbench({ initial, updatedAt }: { initial: PwaSettings; updatedAt?: string | null }) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [active, setActive] = useState<SectionId>('identity');
    const [settings, setSettings] = useState(initial);
    const [status, setStatus] = useState<{ ok: boolean; message: string; savedAt?: string } | null>(null);
    const [showManifest, setShowManifest] = useState(false);
    const [showOverrides, setShowOverrides] = useState(false);
    const [previewSplash, setPreviewSplash] = useState(false);

    const setTop = <K extends keyof PwaSettings>(key: K, value: PwaSettings[K]) => {
        setSettings((current) => ({ ...current, [key]: value }));
    };

    const setTab = (index: number, patch: Partial<PwaTabItem>) => {
        setSettings((current) => ({
            ...current,
            tabs: current.tabs.map((tab, tabIndex) => (tabIndex === index ? { ...tab, ...patch } : tab)),
        }));
    };

    const moveTab = (index: number, direction: -1 | 1) => {
        setSettings((current) => {
            const next = [...current.tabs];
            const target = index + direction;
            if (target < 0 || target >= next.length) return current;
            [next[index], next[target]] = [next[target], next[index]];
            return { ...current, tabs: next };
        });
    };

    const setShortcut = (index: number, patch: Partial<PwaShortcut>) => {
        setSettings((current) => {
            const shortcuts = [...current.shortcuts];
            shortcuts[index] = { ...defaultPwaSettings.shortcuts[0], ...shortcuts[index], ...patch };
            return { ...current, shortcuts };
        });
    };

    const toggleCategory = (category: PwaCategory) => {
        setSettings((current) => {
            const on = current.categories.includes(category);
            const categories = on
                ? current.categories.filter((item) => item !== category)
                : [...current.categories, category];
            return { ...current, categories: categories.length ? categories.slice(0, 5) : ['portfolio'] };
        });
    };

    const submit = () => {
        const form = new FormData();
        form.set('name', settings.name);
        form.set('shortName', settings.shortName);
        form.set('description', settings.description);
        form.set('startUrl', settings.startUrl);
        form.set('scope', settings.scope);
        form.set('id', settings.id);
        form.set('lang', settings.lang);
        form.set('display', settings.display);
        form.set('orientation', settings.orientation);
        form.set('backgroundColor', settings.backgroundColor);
        form.set('themeColor', settings.themeColor);
        form.set('themeColorLight', settings.themeColorLight);
        form.set('iconUrl', settings.iconUrl);
        form.set('icon192Url', settings.icon192Url);
        form.set('icon512Url', settings.icon512Url);
        form.set('appleIconUrl', settings.appleIconUrl);
        form.set('maskableIconUrl', settings.maskableIconUrl);
        form.set('monochromeIconUrl', settings.monochromeIconUrl);
        form.set('screenshotNarrowUrl', settings.screenshotNarrowUrl);
        form.set('screenshotWideUrl', settings.screenshotWideUrl);
        form.set('splashImageUrl', settings.splashImageUrl);
        form.set('splashStyle', settings.splashStyle);
        form.set('splashTagline', settings.splashTagline);
        form.set('splashDurationMs', String(settings.splashDurationMs));
        form.set('readerTheme', settings.readerTheme);
        form.set('handleLinks', settings.handleLinks);
        form.set('launchHandler', settings.launchHandler);
        form.set('statusBarStyle', settings.statusBarStyle);
        form.set('tabBarStyle', settings.tabBarStyle);
        if (settings.displayOverrideWco) form.set('displayOverrideWco', 'on');
        if (settings.shareTargetEnabled) form.set('shareTargetEnabled', 'on');
        if (settings.nativeChrome) form.set('nativeChrome', 'on');
        if (settings.hideSiteChrome) form.set('hideSiteChrome', 'on');
        if (settings.iconAutoPack) form.set('iconAutoPack', 'on');
        if (settings.showInstallPrompt) form.set('showInstallPrompt', 'on');
        if (settings.showIosInstallHint) form.set('showIosInstallHint', 'on');
        if (settings.splashEnabled) form.set('splashEnabled', 'on');
        if (settings.readerModeEnabled) form.set('readerModeEnabled', 'on');
        if (settings.serviceWorkerEnabled) form.set('serviceWorkerEnabled', 'on');
        if (settings.offlineFallbackEnabled) form.set('offlineFallbackEnabled', 'on');
        if (settings.pullToRefresh) form.set('pullToRefresh', 'on');
        if (settings.updatePromptEnabled) form.set('updatePromptEnabled', 'on');
        if (settings.offlineBannerEnabled) form.set('offlineBannerEnabled', 'on');
        if (settings.appBadgeEnabled) form.set('appBadgeEnabled', 'on');
        form.set('tabs', JSON.stringify(settings.tabs));
        form.set('shortcuts', JSON.stringify(settings.shortcuts));
        form.set('categories', JSON.stringify(settings.categories));

        startTransition(async () => {
            const result = await savePwaSettings(form);
            setStatus(result);
            if (result.ok && result.settings) setSettings(result.settings);
            if (result.ok) router.refresh();
        });
    };

    const tabCount = useMemo(() => enabledPwaTabs(settings).length, [settings]);
    const manifestPreview = useMemo(() => pwaSettingsToManifest(settings), [settings]);

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground/10 pb-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    <MonitorSmartphone className="size-3.5" /> Admin / PWA
                </div>
                <div className="text-[10px] text-muted-foreground">{tabCount} visible tabs · {settings.display} · SW {settings.serviceWorkerEnabled ? 'on' : 'off'}</div>
            </div>

            <div className="grid min-w-0 gap-5 xl:grid-cols-[190px_minmax(0,1fr)_320px]">
                <nav aria-label="PWA settings sections" className="xl:sticky xl:top-5 xl:self-start">
                    <div className="flex gap-1 overflow-x-auto pb-2 xl:block xl:space-y-1 xl:overflow-visible xl:pb-0">
                        {sections.map((section) => {
                            const selected = active === section.id;
                            return (
                                <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => setActive(section.id)}
                                    className={`flex min-w-[150px] items-center gap-3 rounded-xl px-3 py-2.5 text-left transition xl:w-full xl:min-w-0 ${selected ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-foreground/[0.045] hover:text-foreground'}`}
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate text-xs font-semibold">{section.label}</span>
                                        <span className={`mt-0.5 hidden truncate text-[10px] xl:block ${selected ? 'text-background/60' : 'text-muted-foreground/70'}`}>{section.hint}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </nav>

                <div className="min-w-0 rounded-2xl border border-foreground/10 bg-foreground/[0.018] p-5 sm:p-6">
                    {active === 'identity' ? (
                        <Panel title="Installed app identity" description="Used by the web app manifest, home-screen icon and splash. Pick one source logo; 192/512/maskable/monochrome and Apple 180 are generated from it. The public website title stays on Settings / SEO.">
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="text-xs text-muted-foreground">App name<input value={settings.name} onChange={(event) => setTop('name', event.target.value)} className={field} maxLength={60} /></label>
                                <label className="text-xs text-muted-foreground">Short name<input value={settings.shortName} onChange={(event) => setTop('shortName', event.target.value)} className={field} maxLength={20} /></label>
                                <label className="text-xs text-muted-foreground md:col-span-2">Description<textarea value={settings.description} onChange={(event) => setTop('description', event.target.value)} className={`${field} min-h-24`} maxLength={180} /></label>
                                <label className="text-xs text-muted-foreground">Start URL<input value={settings.startUrl} onChange={(event) => setTop('startUrl', event.target.value)} className={field} /></label>
                                <label className="text-xs text-muted-foreground">Scope<input value={settings.scope} onChange={(event) => setTop('scope', event.target.value)} className={field} /></label>
                                <label className="text-xs text-muted-foreground">Manifest ID<input value={settings.id} onChange={(event) => setTop('id', event.target.value)} className={field} /></label>
                                <label className="text-xs text-muted-foreground">Language<input value={settings.lang} onChange={(event) => setTop('lang', event.target.value)} className={field} maxLength={8} /></label>
                                <label className="text-xs text-muted-foreground">Display
                                    <select value={settings.display} onChange={(event) => setTop('display', event.target.value as PwaDisplayMode)} className={field}>
                                        <option value="standalone">Standalone — native app</option>
                                        <option value="fullscreen">Fullscreen</option>
                                        <option value="minimal-ui">Minimal UI</option>
                                        <option value="browser">Browser — no native chrome</option>
                                    </select>
                                </label>
                                <label className="text-xs text-muted-foreground">Orientation
                                    <select value={settings.orientation} onChange={(event) => setTop('orientation', event.target.value as PwaOrientation)} className={field}>
                                        <option value="any">Any</option>
                                        <option value="portrait">Portrait</option>
                                        <option value="landscape">Landscape</option>
                                    </select>
                                </label>
                                <div className="md:col-span-2"><MediaPicker label="Source logo" value={settings.iconUrl} onChange={(url) => setSettings((current) => applyGeneratedIconPack({ ...current, iconUrl: url }))} initialKind="image" lockKind /></div>
                                <div className="md:col-span-2 rounded-xl border border-foreground/10 bg-background/40 p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold">Generated icon pack</p>
                                            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                                                One logo becomes 96 / 180 / 192 / 512, a padded maskable Android icon, a monochrome themed icon, and iOS splash screens. JPG, PNG or SVG all work — including files from the media library.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSettings((current) => applyGeneratedIconPack(current))}
                                            className="rounded-lg border border-foreground/10 px-2.5 py-1.5 text-[10px] font-medium text-foreground hover:bg-foreground/5"
                                        >
                                            Rebuild from source
                                        </button>
                                    </div>
                                    <div className="mt-3">
                                    <Toggle
                                        checked={settings.iconAutoPack}
                                        onChange={(value) => {
                                            if (value) setSettings((current) => applyGeneratedIconPack(current));
                                            else setTop('iconAutoPack', false);
                                        }}
                                        label="Always use the generated pack"
                                        hint="Leave on unless you need a one-off override for a single size."
                                    />
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-end gap-4">
                                        {[
                                            [PWA_GENERATED_PACK.icon96, '96'],
                                            [PWA_GENERATED_PACK.icon180, '180'],
                                            [PWA_GENERATED_PACK.icon192, '192'],
                                            [PWA_GENERATED_PACK.icon512, '512'],
                                            [PWA_GENERATED_PACK.maskable, 'maskable'],
                                            [PWA_GENERATED_PACK.monochrome, 'mono'],
                                        ].map(([src, label]) => (
                                            <div key={label} className="text-center">
                                                <img src={`${src}?v=${encodeURIComponent(settings.iconUrl)}`} alt="" className="mx-auto size-12 rounded-xl border border-foreground/10 bg-black object-cover" />
                                                <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" onClick={() => setShowOverrides((value) => !value)} className="mt-4 text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                                        {showOverrides ? 'Hide size overrides' : 'Override a single size'}
                                    </button>
                                    {showOverrides ? (
                                        <div className="mt-3 grid gap-3">
                                            <MediaPicker label="192×192 override" value={settings.icon192Url} onChange={(url) => setSettings((current) => ({ ...current, iconAutoPack: false, icon192Url: url }))} initialKind="image" lockKind />
                                            <MediaPicker label="512×512 override" value={settings.icon512Url} onChange={(url) => setSettings((current) => ({ ...current, iconAutoPack: false, icon512Url: url }))} initialKind="image" lockKind />
                                            <MediaPicker label="Apple 180 override" value={settings.appleIconUrl} onChange={(url) => setSettings((current) => ({ ...current, iconAutoPack: false, appleIconUrl: url }))} initialKind="image" lockKind />
                                            <MediaPicker label="Maskable override" value={settings.maskableIconUrl} onChange={(url) => setSettings((current) => ({ ...current, iconAutoPack: false, maskableIconUrl: url }))} initialKind="image" lockKind />
                                            <MediaPicker label="Monochrome override" value={settings.monochromeIconUrl} onChange={(url) => setSettings((current) => ({ ...current, iconAutoPack: false, monochromeIconUrl: url }))} initialKind="image" lockKind />
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </Panel>
                    ) : null}

                    {active === 'chrome' ? (
                        <Panel title="Native chrome" description="These controls apply only after the visitor installs the site. Regular browser tabs keep the current website navigation.">
                            <div className="space-y-3">
                                <Toggle checked={settings.nativeChrome} onChange={(value) => setTop('nativeChrome', value)} label="Native tab bar" hint="Show a bottom tab bar when the site is opened as an installed app." />
                                <Toggle checked={settings.hideSiteChrome} onChange={(value) => setTop('hideSiteChrome', value)} label="Hide website nav in the installed app" hint="Hides the public navbar and footer only in standalone/fullscreen display mode." />
                                <Toggle checked={settings.pullToRefresh} onChange={(value) => setTop('pullToRefresh', value)} label="Pull to refresh" hint="Native pull gesture in the installed app only. Off in regular browser tabs." />
                                <label className="text-xs text-muted-foreground">Tab bar style
                                    <select value={settings.tabBarStyle} onChange={(event) => setTop('tabBarStyle', event.target.value as PwaTabBarStyle)} className={field}>
                                        <option value="docked">Docked</option>
                                        <option value="floating">Floating</option>
                                    </select>
                                </label>
                                <label className="text-xs text-muted-foreground">iOS status bar
                                    <select value={settings.statusBarStyle} onChange={(event) => setTop('statusBarStyle', event.target.value as PwaStatusBarStyle)} className={field}>
                                        <option value="default">Default</option>
                                        <option value="black">Black</option>
                                        <option value="black-translucent">Black translucent</option>
                                    </select>
                                </label>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <label className="text-xs text-muted-foreground">Theme color<input type="color" value={settings.themeColor} onChange={(event) => setTop('themeColor', event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-foreground/10 bg-transparent" /></label>
                                    <label className="text-xs text-muted-foreground">Background<input type="color" value={settings.backgroundColor} onChange={(event) => setTop('backgroundColor', event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-foreground/10 bg-transparent" /></label>
                                    <label className="text-xs text-muted-foreground">Light theme color<input type="color" value={settings.themeColorLight} onChange={(event) => setTop('themeColorLight', event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-foreground/10 bg-transparent" /></label>
                                </div>
                            </div>
                        </Panel>
                    ) : null}

                    {active === 'tabs' ? (
                        <Panel title="Installed tab bar" description="Up to five destinations. Unused tabs can be disabled instead of deleted, so you can bring them back later.">
                            <div className="space-y-3">
                                {settings.tabs.map((tab, index) => (
                                    <div key={`${tab.id}-${index}`} className="rounded-xl border border-foreground/10 bg-background/40 p-4">
                                        <div className="mb-3 flex items-center justify-between gap-2">
                                            <label className="inline-flex items-center gap-2 text-xs font-semibold">
                                                <input type="checkbox" checked={tab.enabled} onChange={(event) => setTab(index, { enabled: event.target.checked })} className="size-4 accent-sky-500" />
                                                Tab {index + 1}
                                            </label>
                                            <div className="flex gap-1">
                                                <button type="button" onClick={() => moveTab(index, -1)} className="rounded-lg border border-foreground/10 p-1.5 text-muted-foreground hover:text-foreground" aria-label="Move tab up"><ChevronUp className="size-3.5" /></button>
                                                <button type="button" onClick={() => moveTab(index, 1)} className="rounded-lg border border-foreground/10 p-1.5 text-muted-foreground hover:text-foreground" aria-label="Move tab down"><ChevronDown className="size-3.5" /></button>
                                            </div>
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-3">
                                            <label className="text-xs text-muted-foreground">Label<input value={tab.label} onChange={(event) => setTab(index, { label: event.target.value })} className={field} maxLength={24} /></label>
                                            <label className="text-xs text-muted-foreground">Path<input value={tab.href} onChange={(event) => setTab(index, { href: event.target.value })} className={field} /></label>
                                            <label className="text-xs text-muted-foreground">Icon
                                                <select value={tab.icon} onChange={(event) => setTab(index, { icon: event.target.value as PwaTabIcon })} className={field}>
                                                    {PWA_TAB_ICONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                                                </select>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6">
                                <p className="mb-3 text-xs font-semibold">Home-screen shortcuts</p>
                                <div className="space-y-3">
                                    {[0, 1, 2, 3].map((index) => {
                                        const shortcut = settings.shortcuts[index] ?? { name: '', url: '/', description: '', iconUrl: '' };
                                        return (
                                            <div key={index} className="space-y-3 rounded-xl border border-foreground/10 p-3">
                                                <div className="grid gap-3 md:grid-cols-3">
                                                    <input value={shortcut.name} onChange={(event) => setShortcut(index, { name: event.target.value })} placeholder="Shortcut name" className={field} />
                                                    <input value={shortcut.url} onChange={(event) => setShortcut(index, { url: event.target.value })} placeholder="/blog" className={field} />
                                                    <input value={shortcut.description} onChange={(event) => setShortcut(index, { description: event.target.value })} placeholder="Description" className={field} />
                                                </div>
                                                <MediaPicker label="Shortcut icon (96×96)" value={shortcut.iconUrl} onChange={(url) => setShortcut(index, { iconUrl: url })} initialKind="image" lockKind />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Panel>
                    ) : null}

                    {active === 'manifest' ? (
                        <Panel title="Manifest extras" description="Mirrors vite-plugin-pwa ManifestOptions and SuperPWA install-UI fields: screenshots, display_override, handle_links, launch_handler, categories and share_target.">
                            <div className="space-y-3">
                                <Toggle checked={settings.displayOverrideWco} onChange={(value) => setTop('displayOverrideWco', value)} label="Window controls overlay" hint="Adds display_override: window-controls-overlay for installed desktop PWAs." />
                                <Toggle checked={settings.shareTargetEnabled} onChange={(value) => setTop('shareTargetEnabled', value)} label="Share target" hint="Lets other apps share links into /contact. Off by default." />
                                <label className="text-xs text-muted-foreground">Handle links
                                    <select value={settings.handleLinks} onChange={(event) => setTop('handleLinks', event.target.value as PwaHandleLinks)} className={field}>
                                        <option value="preferred">Preferred — open necrotixlab.com in the app</option>
                                        <option value="auto">Auto</option>
                                        <option value="not-preferred">Not preferred</option>
                                    </select>
                                </label>
                                <label className="text-xs text-muted-foreground">Launch handler
                                    <select value={settings.launchHandler} onChange={(event) => setTop('launchHandler', event.target.value as PwaLaunchHandler)} className={field}>
                                        <option value="navigate-existing">Reuse the open window</option>
                                        <option value="focus-existing">Focus existing</option>
                                        <option value="navigate-new">Always a new window</option>
                                        <option value="auto">Auto</option>
                                    </select>
                                </label>
                                <div>
                                    <p className="mb-2 text-xs text-muted-foreground">Categories</p>
                                    <div className="flex flex-wrap gap-2">
                                        {PWA_CATEGORIES.map((category) => {
                                            const on = settings.categories.includes(category);
                                            return (
                                                <button
                                                    key={category}
                                                    type="button"
                                                    onClick={() => toggleCategory(category)}
                                                    className={`rounded-full border px-3 py-1.5 text-[11px] capitalize ${on ? 'border-sky-400/40 bg-sky-400/10 text-foreground' : 'border-foreground/10 text-muted-foreground'}`}
                                                >
                                                    {category}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <MediaPicker label="Narrow screenshot (phone install UI)" value={settings.screenshotNarrowUrl} onChange={(url) => setTop('screenshotNarrowUrl', url)} initialKind="image" lockKind />
                                        {settings.screenshotNarrowUrl ? <img src={settings.screenshotNarrowUrl} alt="" className="mt-2 h-40 w-auto rounded-xl border border-foreground/10 object-cover" /> : null}
                                    </div>
                                    <div>
                                        <MediaPicker label="Wide screenshot (desktop install UI)" value={settings.screenshotWideUrl} onChange={(url) => setTop('screenshotWideUrl', url)} initialKind="image" lockKind />
                                        {settings.screenshotWideUrl ? <img src={settings.screenshotWideUrl} alt="" className="mt-2 h-40 w-full rounded-xl border border-foreground/10 object-cover" /> : null}
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowManifest((value) => !value)} className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                                    {showManifest ? 'Hide generated manifest' : 'Show generated manifest'}
                                </button>
                                {showManifest ? (
                                    <pre className="max-h-72 overflow-auto rounded-xl border border-foreground/10 bg-background/50 p-3 font-mono text-[10px] leading-4 text-muted-foreground">
                                        {JSON.stringify(manifestPreview, null, 2)}
                                    </pre>
                                ) : null}
                            </div>
                        </Panel>
                    ) : null}

                    {active === 'reading' ? (
                        <Panel title="Splash & reader" description="Launch splash and journal reader apply only in the installed app. Regular browser tabs keep the current article layout.">
                            <div className="space-y-4">
                                <Toggle checked={settings.splashEnabled} onChange={(value) => setTop('splashEnabled', value)} label="Launch splash" hint="A short branded splash on first open of an installed session." />
                                <div>
                                    <p className="mb-2 text-xs text-muted-foreground">Splash layout</p>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                        {PWA_SPLASH_STYLES.map((style) => (
                                            <button
                                                key={style}
                                                type="button"
                                                onClick={() => setTop('splashStyle', style)}
                                                className={`rounded-xl border px-2 py-3 text-center text-[10px] capitalize ${settings.splashStyle === style ? 'border-sky-400/40 bg-sky-400/10 text-foreground' : 'border-foreground/10 text-muted-foreground'}`}
                                            >
                                                {splashLabel(style)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <label className="text-xs text-muted-foreground">Tagline
                                    <input value={settings.splashTagline} onChange={(event) => setTop('splashTagline', event.target.value)} className={field} maxLength={80} placeholder="Optional line under the name" />
                                </label>
                                <label className="text-xs text-muted-foreground">Duration (ms)
                                    <input type="number" min={400} max={2400} step={50} value={settings.splashDurationMs} onChange={(event) => setTop('splashDurationMs', Number(event.target.value))} className={field} />
                                </label>
                                {settings.splashStyle === 'image' ? (
                                    <MediaPicker label="Custom splash image" value={settings.splashImageUrl} onChange={(url) => setTop('splashImageUrl', url)} initialKind="image" lockKind />
                                ) : null}
                                <button type="button" onClick={() => setPreviewSplash(true)} className="rounded-xl border border-foreground/10 px-3 py-2 text-xs font-medium hover:bg-foreground/5">
                                    Preview splash
                                </button>
                                <div className="border-t border-foreground/10 pt-4">
                                    <Toggle checked={settings.readerModeEnabled} onChange={(value) => setTop('readerModeEnabled', value)} label="Journal reader mode" hint="A book button on journal articles in the installed app. Paper, sepia and night themes. Off in regular browser tabs." />
                                    <label className="mt-3 block text-xs text-muted-foreground">Default reader theme
                                        <select value={settings.readerTheme} onChange={(event) => setTop('readerTheme', event.target.value as PwaReaderTheme)} className={field}>
                                            {PWA_READER_THEMES.map((theme) => <option key={theme} value={theme}>{theme}</option>)}
                                        </select>
                                    </label>
                                </div>
                            </div>
                        </Panel>
                    ) : null}

                    {active === 'offline' ? (
                        <Panel title="Offline & updates" description="Service worker stays off until you enable it, so production cache is never hijacked by default. Patterns from SuperPWA cache + vite-plugin-pwa update prompts.">
                            <div className="space-y-3">
                                <Toggle checked={settings.serviceWorkerEnabled} onChange={(value) => setTop('serviceWorkerEnabled', value)} label="Register service worker" hint="Opt-in. Serves /pwa-sw.js. Does not cache /admin or /api." />
                                <Toggle checked={settings.offlineFallbackEnabled} onChange={(value) => setTop('offlineFallbackEnabled', value)} label="Offline reading" hint="Network-first cache for Home, Journal, Projects, Gallery and Contact, plus /offline.html if a page was never visited." />
                                <Toggle checked={settings.updatePromptEnabled} onChange={(value) => setTop('updatePromptEnabled', value)} label="Update prompt" hint="Ask before swapping a waiting worker. Only appears in the installed app." />
                                <Toggle checked={settings.offlineBannerEnabled} onChange={(value) => setTop('offlineBannerEnabled', value)} label="Offline banner" hint="A small status chip when the installed app loses the network." />
                                <Toggle checked={settings.appBadgeEnabled} onChange={(value) => setTop('appBadgeEnabled', value)} label="App icon badge" hint="Shows a count on the installed icon for new service requests and recent comments. Only for signed-in admins in standalone mode." />
                            </div>
                        </Panel>
                    ) : null}

                    {active === 'install' ? (
                        <Panel title="Install prompts" description="Both banners stay off by default so the public website is unchanged. Enable them only if you want visitors to be invited to install.">
                            <div className="space-y-3">
                                <Toggle checked={settings.showInstallPrompt} onChange={(value) => setTop('showInstallPrompt', value)} label="Android / desktop install banner" hint="Shows after the browser fires beforeinstallprompt. Off by default." />
                                <Toggle checked={settings.showIosInstallHint} onChange={(value) => setTop('showIosInstallHint', value)} label="iOS Add to Home Screen hint" hint="A one-time hint on iPhone/iPad Safari. Off by default." />
                            </div>
                            <div className="mt-5 rounded-xl border border-amber-300/10 bg-amber-300/[0.04] px-4 py-3 text-xs leading-5 text-muted-foreground">
                                The public homepage, journal, projects and gallery keep their current layout in a normal browser tab. Native chrome is gated to `display-mode: standalone`.
                            </div>
                        </Panel>
                    ) : null}

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-foreground/10 pt-4">
                        <div className="text-[11px] text-muted-foreground">
                            {status ? <span className={status.ok ? 'text-emerald-500' : 'text-rose-500'}>{status.message}</span> : updatedAt ? `Last saved ${new Date(updatedAt).toLocaleString()}` : 'Using current live-site PWA defaults until first save.'}
                        </div>
                        <button type="button" onClick={submit} disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                            {pending ? <span className="size-3.5 animate-spin rounded-full border-2 border-background/30 border-t-background" /> : status?.ok ? <Check className="size-3.5" /> : <Save className="size-3.5" />}
                            {pending ? 'Saving...' : 'Save PWA settings'}
                        </button>
                    </div>
                </div>

                <div className="xl:sticky xl:top-5 xl:self-start">
                    <PhonePreview settings={settings} />
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] text-muted-foreground">
                        <div className="rounded-xl border border-foreground/10 px-2 py-3"><Smartphone className="mx-auto mb-1 size-3.5" />Standalone</div>
                        <div className="rounded-xl border border-foreground/10 px-2 py-3"><Palette className="mx-auto mb-1 size-3.5" />Theme</div>
                        <div className="rounded-xl border border-foreground/10 px-2 py-3">{settings.showInstallPrompt ? <Share className="mx-auto mb-1 size-3.5" /> : <Sparkles className="mx-auto mb-1 size-3.5" />}{settings.showInstallPrompt ? 'Banner on' : 'Site intact'}</div>
                    </div>
                </div>
            </div>
            {previewSplash ? (
                <button type="button" onClick={() => setPreviewSplash(false)} className="fixed inset-0 z-50 grid place-items-center bg-black/70" aria-label="Dismiss splash preview">
                    <span className="pointer-events-none h-[70vh] w-[min(22rem,90vw)] overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
                        <AdminSplashPreview settings={settings} />
                    </span>
                </button>
            ) : null}
        </div>
    );
}

function splashLabel(style: PwaSplashStyle) {
    if (style === 'logo-name') return 'Logo + name';
    if (style === 'wordmark') return 'Name only';
    if (style === 'image') return 'Image';
    if (style === 'solid') return 'Color';
    return 'Logo';
}

function AdminSplashPreview({ settings }: { settings: PwaSettings }) {
    const pack = resolvedPwaIconUrls(settings);
    const ink = '#f4f0ea';
    const background = settings.backgroundColor;
    if (settings.splashStyle === 'image' && settings.splashImageUrl) {
        return <img src={settings.splashImageUrl} alt="" className="h-full w-full object-cover" />;
    }
    if (settings.splashStyle === 'solid') {
        return <span className="block h-full w-full" style={{ background }} />;
    }
    return (
        <span className="flex h-full w-full flex-col items-center justify-center gap-4" style={{ background, color: ink }}>
            {settings.splashStyle !== 'wordmark' ? <img src={pack.icon180} alt="" className="size-16 rounded-2xl object-contain" /> : null}
            {settings.splashStyle !== 'logo' ? (
                <>
                    <span className="text-lg font-semibold tracking-tight">{settings.shortName}</span>
                    {settings.splashTagline ? <span className="text-[11px] opacity-60">{settings.splashTagline}</span> : null}
                </>
            ) : null}
        </span>
    );
}
