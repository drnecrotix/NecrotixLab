'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BookOpen,
    Briefcase,
    Compass,
    FlaskConical,
    Home,
    Image,
    Mail,
    Map,
    MoreHorizontal,
    RefreshCw,
    Settings,
    Sparkles,
    Store,
    User,
    WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { enabledPwaTabs, resolvedPwaIconUrls, type PwaSettings, type PwaTabIcon } from '@/lib/pwa-settings';
import { PwaReaderMode } from '@/components/pwa/PwaReaderMode';
import { PwaUpdateNotice } from '@/components/pwa/PwaUpdateNotice';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type NavigatorWithBadge = Navigator & {
    setAppBadge?: (count: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
};

const iconMap: Record<PwaTabIcon, typeof Home> = {
    home: Home,
    journal: BookOpen,
    projects: Briefcase,
    gallery: Image,
    lab: FlaskConical,
    contact: Mail,
    store: Store,
    more: MoreHorizontal,
    user: User,
    compass: Compass,
    sparkles: Sparkles,
    map: Map,
    settings: Settings,
};

function isStandaloneDisplay() {
    if (typeof window === 'undefined') return false;
    const media = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui), (display-mode: window-controls-overlay)');
    const ios = 'standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
    return media.matches || ios;
}

function isIosDevice() {
    if (typeof window === 'undefined') return false;
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function haptic() {
    try {
        window.navigator.vibrate?.(8);
    } catch {
        // Some browsers expose vibrate but reject it outside a user gesture.
    }
}

function pathMatches(pathname: string, href: string) {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
}

export function NativePwaLayer({ settings }: { settings: PwaSettings }) {
    const pathname = usePathname() || '/';
    const [standalone, setStandalone] = useState(false);
    const [hydrated, setHydrated] = useState(false);
    const [splash, setSplash] = useState(false);
    const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
    const [installDismissed, setInstallDismissed] = useState(false);
    const [iosHint, setIosHint] = useState(false);
    const [offline, setOffline] = useState(false);
    const [pullOffset, setPullOffset] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const pullRef = useRef(0);
    const startY = useRef(0);
    const pulling = useRef(false);
    const isAdmin = pathname.startsWith('/admin');
    const tabs = useMemo(() => enabledPwaTabs(settings), [settings]);

    useEffect(() => {
        const sync = () => {
            const next = isStandaloneDisplay();
            setStandalone(next);
            document.documentElement.dataset.pwaStandalone = next ? '1' : '0';
            document.documentElement.style.setProperty('--pwa-bg', settings.backgroundColor);
        };
        sync();
        setHydrated(true);
        const media = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui), (display-mode: window-controls-overlay)');
        media.addEventListener('change', sync);
        return () => media.removeEventListener('change', sync);
    }, [settings.backgroundColor]);

    useEffect(() => {
        if (!hydrated || !standalone || !settings.splashEnabled || isAdmin) return;
        const seen = sessionStorage.getItem('pwa-splash-seen');
        if (seen) return;
        setSplash(true);
        sessionStorage.setItem('pwa-splash-seen', '1');
        const timer = window.setTimeout(() => setSplash(false), settings.splashDurationMs || 900);
        return () => window.clearTimeout(timer);
    }, [hydrated, standalone, settings.splashEnabled, settings.splashDurationMs, isAdmin]);

    useEffect(() => {
        if (!hydrated || !standalone || isAdmin || !settings.appBadgeEnabled) return;
        const nav = window.navigator as NavigatorWithBadge;
        let cancelled = false;
        const sync = async () => {
            try {
                const response = await fetch('/api/pwa/badge', { credentials: 'include' });
                if (!response.ok) {
                    await nav.clearAppBadge?.();
                    return;
                }
                const payload = await response.json() as { count?: number };
                if (cancelled) return;
                const count = Number(payload.count) || 0;
                if (count > 0) await nav.setAppBadge?.(count);
                else await nav.clearAppBadge?.();
            } catch {
                // Badge API is optional and admin-only.
            }
        };
        void sync();
        const timer = window.setInterval(() => void sync(), 120000);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [hydrated, standalone, isAdmin, settings.appBadgeEnabled]);

    useEffect(() => {
        if (isAdmin || settings.showInstallPrompt === false) return;
        const onPrompt = (event: Event) => {
            event.preventDefault();
            setInstallEvent(event as BeforeInstallPromptEvent);
        };
        window.addEventListener('beforeinstallprompt', onPrompt);
        return () => window.removeEventListener('beforeinstallprompt', onPrompt);
    }, [isAdmin, settings.showInstallPrompt]);

    useEffect(() => {
        if (isAdmin || standalone || !settings.showIosInstallHint || !isIosDevice()) return;
        const dismissed = window.localStorage.getItem('pwa-ios-hint-dismissed');
        if (!dismissed) setIosHint(true);
    }, [isAdmin, standalone, settings.showIosInstallHint]);

    useEffect(() => {
        if (!settings.offlineBannerEnabled) return;
        const sync = () => setOffline(!window.navigator.onLine);
        sync();
        window.addEventListener('online', sync);
        window.addEventListener('offline', sync);
        return () => {
            window.removeEventListener('online', sync);
            window.removeEventListener('offline', sync);
        };
    }, [settings.offlineBannerEnabled]);

    useEffect(() => {
        if (!('serviceWorker' in navigator) || isAdmin) return;

        if (!settings.serviceWorkerEnabled) {
            void navigator.serviceWorker.getRegistrations().then((regs) => {
                regs
                    .filter((reg) => (reg.active?.scriptURL || reg.waiting?.scriptURL || '').includes('pwa-sw.js'))
                    .forEach((reg) => void reg.unregister());
            });
            return;
        }

        let registration: ServiceWorkerRegistration | undefined;

        void navigator.serviceWorker.register(
            settings.offlineFallbackEnabled ? '/pwa-sw.js?offline=1' : '/pwa-sw.js',
            { scope: '/' },
        ).then((reg) => {
            registration = reg;
            void reg.update();
        }).catch(() => {
            // Hosts without SW support still get native chrome.
        });

        const onVisible = () => {
            if (document.visibilityState === 'visible') void registration?.update();
        };
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('focus', onVisible);

        return () => {
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('focus', onVisible);
        };
    }, [isAdmin, settings.serviceWorkerEnabled, settings.offlineFallbackEnabled]);

    useEffect(() => {
        if (!standalone || !settings.pullToRefresh || isAdmin) return;

        const onStart = (event: TouchEvent) => {
            if (window.scrollY > 2) return;
            startY.current = event.touches[0]?.clientY ?? 0;
            pulling.current = true;
        };
        const onMove = (event: TouchEvent) => {
            if (!pulling.current) return;
            const dy = (event.touches[0]?.clientY ?? 0) - startY.current;
            if (dy <= 0) {
                pullRef.current = 0;
                setPullOffset(0);
                return;
            }
            const next = Math.min(72, dy * 0.42);
            pullRef.current = next;
            setPullOffset(next);
        };
        const onEnd = () => {
            if (!pulling.current) return;
            pulling.current = false;
            if (pullRef.current > 54) {
                setRefreshing(true);
                window.setTimeout(() => window.location.reload(), 240);
                return;
            }
            pullRef.current = 0;
            setPullOffset(0);
        };

        window.addEventListener('touchstart', onStart, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onEnd);
        return () => {
            window.removeEventListener('touchstart', onStart);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onEnd);
        };
    }, [standalone, settings.pullToRefresh, isAdmin]);

    const install = useCallback(async () => {
        if (!installEvent) return;
        await installEvent.prompt();
        const choice = await installEvent.userChoice;
        if (choice.outcome !== 'accepted') setInstallDismissed(true);
        setInstallEvent(null);
    }, [installEvent]);

    if (isAdmin) return null;

    const showTabs = hydrated && standalone && settings.nativeChrome && tabs.length > 0;
    const showInstall = hydrated && !standalone && settings.showInstallPrompt && Boolean(installEvent) && !installDismissed;
    const showIos = hydrated && !standalone && iosHint;
    const showOffline = hydrated && standalone && settings.offlineBannerEnabled && offline;
    const showPull = standalone && settings.pullToRefresh && (pullOffset > 0 || refreshing);
    const pack = resolvedPwaIconUrls(settings);
    const splashInk = isDarkBackground(settings.backgroundColor) ? '#f4f0ea' : '#16141c';

    return (
        <>
            {splash ? <SplashCard settings={settings} iconSrc={pack.icon180} ink={splashInk} /> : null}

            {showPull ? (
                <div
                    className="pointer-events-none fixed inset-x-0 z-[145] flex justify-center"
                    style={{ top: `calc(${Math.max(pullOffset - 10, 8)}px + env(safe-area-inset-top, 0px))` }}
                >
                    <span className="grid size-8 place-items-center rounded-full border border-white/10 bg-black/70 text-white">
                        <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
                    </span>
                </div>
            ) : null}

            {showOffline ? (
                <div className="pointer-events-none fixed inset-x-0 top-0 z-[146] flex justify-center px-4 pt-[max(0.7rem,env(safe-area-inset-top))]">
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/80 px-3 py-1.5 text-[11px] text-white shadow-2xl">
                        <WifiOff className="size-3.5" />
                        You are offline. Cached pages stay available.
                    </div>
                </div>
            ) : null}

            {hydrated && standalone ? <PwaUpdateNotice settings={settings} standalone={standalone} /> : null}

            {showInstall ? (
                <div className="fixed inset-x-3 bottom-3 z-[140] rounded-2xl border border-white/10 bg-black/85 p-3 text-white shadow-2xl backdrop-blur-xl sm:left-auto sm:right-4 sm:w-[360px]">
                    <p className="text-xs font-semibold">Install {settings.shortName}</p>
                    <p className="mt-1 text-[11px] leading-5 text-white/55">Add the app to your home screen for a native tab bar and fullscreen reading.</p>
                    <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => { setInstallDismissed(true); setInstallEvent(null); }} className="flex-1 rounded-xl border border-white/10 px-3 py-2 text-[11px] text-white/70">Not now</button>
                        <button type="button" onClick={() => void install()} className="flex-1 rounded-xl bg-white px-3 py-2 text-[11px] font-semibold text-black">Install</button>
                    </div>
                </div>
            ) : null}

            {showIos ? (
                <div className="fixed inset-x-3 bottom-3 z-[140] rounded-2xl border border-white/10 bg-black/85 p-3 text-white shadow-2xl backdrop-blur-xl sm:left-auto sm:right-4 sm:w-[360px]">
                    <p className="text-xs font-semibold">Add to Home Screen</p>
                    <p className="mt-1 text-[11px] leading-5 text-white/55">On iPhone, open Share and choose Add to Home Screen to use the native app chrome.</p>
                    <button
                        type="button"
                        onClick={() => {
                            window.localStorage.setItem('pwa-ios-hint-dismissed', '1');
                            setIosHint(false);
                        }}
                        className="mt-3 w-full rounded-xl border border-white/10 px-3 py-2 text-[11px] text-white/70"
                    >
                        Got it
                    </button>
                </div>
            ) : null}

            {showTabs ? (
                <nav
                    aria-label="Installed app tabs"
                    className={cn(
                        'fixed inset-x-0 bottom-0 z-[130] border-t border-white/10 bg-background/88 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-2xl',
                        settings.tabBarStyle === 'floating' && 'inset-x-3 bottom-[max(0.65rem,env(safe-area-inset-bottom))] rounded-3xl border pb-2',
                    )}
                >
                    <div className="mx-auto grid max-w-lg grid-flow-col auto-cols-fr px-1 pt-1">
                        {tabs.map((tab) => {
                            const Icon = iconMap[tab.icon] ?? Home;
                            const active = pathMatches(pathname, tab.href);
                            return (
                                <Link
                                    key={tab.id}
                                    href={tab.href}
                                    onClick={haptic}
                                    className={cn(
                                        'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[10px] font-medium transition',
                                        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <span className={cn('grid size-8 place-items-center rounded-full', active && 'bg-foreground/8')}>
                                        <Icon className="size-4" strokeWidth={active ? 2.4 : 1.8} />
                                    </span>
                                    <span className="max-w-full truncate">{tab.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            ) : null}

            <PwaReaderMode settings={settings} pathname={pathname} standalone={standalone && hydrated} />
        </>
    );
}

function isDarkBackground(hex: string) {
    const n = Number.parseInt(hex.slice(1), 16);
    if (!Number.isFinite(n)) return true;
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

function SplashCard({ settings, iconSrc, ink }: { settings: PwaSettings; iconSrc: string; ink: string }) {
    const style = settings.splashStyle;
    const background = settings.backgroundColor || '#0c0a12';

    if (style === 'image' && settings.splashImageUrl) {
        return (
            <div className="pointer-events-none fixed inset-0 z-[200]" style={{ background }}>
                <img src={settings.splashImageUrl} alt="" className="h-full w-full object-cover" />
            </div>
        );
    }

    if (style === 'solid') {
        return <div className="pointer-events-none fixed inset-0 z-[200]" style={{ background }} />;
    }

    return (
        <div className="pointer-events-none fixed inset-0 z-[200] grid place-items-center" style={{ background, color: ink }}>
            <div className="flex flex-col items-center gap-4 px-8 text-center">
                {style !== 'wordmark' ? (
                    <img src={iconSrc} alt="" className="size-16 rounded-2xl object-contain" />
                ) : null}
                {style !== 'logo' ? (
                    <>
                        <p className="text-lg font-semibold tracking-tight">{settings.shortName}</p>
                        {settings.splashTagline ? <p className="text-[11px] opacity-60">{settings.splashTagline}</p> : null}
                    </>
                ) : null}
            </div>
        </div>
    );
}
