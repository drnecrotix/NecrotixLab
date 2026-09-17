'use client';

import { useEffect, useState } from 'react';
import { Moon, Settings, Sun, Vibrate, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
    appearanceToTheme,
    readPwaClientPrefs,
    themeToAppearance,
    writePwaClientPrefs,
    type PwaClientAppearance,
    type PwaClientPrefs,
} from '@/lib/pwa-client-prefs';

export function PwaClientSettings({ standalone }: { standalone: boolean }) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [open, setOpen] = useState(false);
    const [prefs, setPrefs] = useState<PwaClientPrefs>(readPwaClientPrefs);

    useEffect(() => {
        if (!standalone) {
            setOpen(false);
            return;
        }
        const stored = readPwaClientPrefs();
        setPrefs(stored);
        const nextTheme = appearanceToTheme(stored.appearance);
        if (theme !== nextTheme && resolvedTheme !== nextTheme) setTheme(nextTheme);
    }, [standalone, setTheme, theme, resolvedTheme]);

    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const commit = (next: PwaClientPrefs) => {
        setPrefs(next);
        writePwaClientPrefs(next);
        setTheme(appearanceToTheme(next.appearance));
    };

    const setAppearance = (appearance: PwaClientAppearance) => {
        commit({ ...prefs, appearance });
    };

    if (!standalone) return null;

    const appearance = themeToAppearance(resolvedTheme || theme || prefs.appearance);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="fixed right-3 z-[141] grid size-10 place-items-center rounded-full border border-foreground/10 bg-background/80 text-foreground shadow-lg backdrop-blur-xl"
                style={{ top: 'calc(0.7rem + env(safe-area-inset-top, 0px))' }}
                aria-label="App settings"
            >
                <Settings className="size-4" />
            </button>

            {open ? (
                <>
                    <button
                        type="button"
                        aria-label="Close settings"
                        className="fixed inset-0 z-[148] bg-black/45 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    <div
                        role="dialog"
                        aria-label="App settings"
                        className="fixed inset-x-3 z-[149] rounded-3xl border border-foreground/10 bg-background/95 p-4 text-foreground shadow-2xl backdrop-blur-xl sm:left-auto sm:right-3 sm:w-[22rem]"
                        style={{ top: 'calc(3.4rem + env(safe-area-inset-top, 0px))' }}
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Client</p>
                                <h2 className="text-sm font-semibold">App settings</h2>
                            </div>
                            <button type="button" onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-full text-muted-foreground" aria-label="Close settings">
                                <X className="size-4" />
                            </button>
                        </div>

                        <p className="mb-2 text-[11px] text-muted-foreground">Appearance</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setAppearance('day')}
                                className={cn(
                                    'flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-xs font-medium',
                                    appearance === 'day' ? 'border-foreground/30 bg-foreground/8' : 'border-foreground/10 text-muted-foreground',
                                )}
                            >
                                <Sun className="size-3.5" />
                                Day
                            </button>
                            <button
                                type="button"
                                onClick={() => setAppearance('night')}
                                className={cn(
                                    'flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-xs font-medium',
                                    appearance === 'night' ? 'border-foreground/30 bg-foreground/8' : 'border-foreground/10 text-muted-foreground',
                                )}
                            >
                                <Moon className="size-3.5" />
                                Night
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => commit({ ...prefs, haptics: !prefs.haptics })}
                            className="mt-3 flex w-full items-center justify-between rounded-2xl border border-foreground/10 px-3 py-3 text-xs"
                        >
                            <span className="inline-flex items-center gap-2">
                                <Vibrate className="size-3.5" />
                                Haptics
                            </span>
                            <span className={cn('rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide', prefs.haptics ? 'bg-foreground text-background' : 'bg-foreground/10 text-muted-foreground')}>
                                {prefs.haptics ? 'On' : 'Off'}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => commit({ ...prefs, pullToRefresh: !prefs.pullToRefresh })}
                            className="mt-2 flex w-full items-center justify-between rounded-2xl border border-foreground/10 px-3 py-3 text-xs"
                        >
                            <span>Pull to refresh</span>
                            <span className={cn('rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide', prefs.pullToRefresh ? 'bg-foreground text-background' : 'bg-foreground/10 text-muted-foreground')}>
                                {prefs.pullToRefresh ? 'On' : 'Off'}
                            </span>
                        </button>
                    </div>
                </>
            ) : null}
        </>
    );
}
