'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
    Settings,
    Sparkles,
    Store,
    User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { enabledPwaTabs, type PwaSettings, type PwaTabIcon } from '@/lib/pwa-settings';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
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
    const media = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)');
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
        const media = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)');
        media.addEventListener('change', sync);
        return () => media.removeEventListener('change', sync);
    }, [settings.backgroundColor]);

    useEffect(() => {
        if (!hydrated || !standalone || !settings.splashEnabled || isAdmin) return;
        const seen = sessionStorage.getItem('pwa-splash-seen');
        if (seen) return;
        setSplash(true);
        sessionStorage.setItem('pwa-splash-seen', '1');
        const timer = window.setTimeout(() => setSplash(false), 780);
        return () => window.clearTimeout(timer);
    }, [hydrated, standalone, settings.splashEnabled, isAdmin]);

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

    return (
        <>
            {splash ? (
                <div className="pointer-events-none fixed inset-0 z-[200] grid place-items-center bg-[var(--pwa-bg,#0c0a12)] text-white">
                    <div className="flex flex-col items-center gap-4">
                        <img src={settings.appleIconUrl || settings.iconUrl} alt="" className="size-16 rounded-2xl object-contain" />
                        <p className="text-sm font-semibold tracking-tight">{settings.shortName}</p>
                    </div>
                </div>
            ) : null}

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
        </>
    );
}
