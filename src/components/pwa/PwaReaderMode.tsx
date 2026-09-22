'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { BookOpen, Eye, Minus, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PwaReaderTheme, PwaSettings } from '@/lib/pwa-settings';
import { isPwaReaderPath } from '@/lib/pwa-settings';

const THEMES: Array<{ id: PwaReaderTheme; label: string }> = [
    { id: 'system', label: 'Site theme' },
    { id: 'paper', label: 'Paper' },
    { id: 'sepia', label: 'Sepia' },
    { id: 'night', label: 'Night' },
];

const SIZES = [0.92, 1, 1.12, 1.26, 1.5, 1.78] as const;
const LOW_VISION_MIN_INDEX = 4;
const STORAGE_KEY = 'pwa-reader-preferences-v2';

function isReaderTheme(value: unknown): value is PwaReaderTheme {
    return THEMES.some((item) => item.id === value);
}

function dock(standalone: boolean, rem: number) {
    const offset = standalone ? rem : Math.max(1.1, rem - 4.15);
    return `calc(${offset}rem + env(safe-area-inset-bottom, 0px))`;
}

export function PwaReaderMode({
    settings,
    pathname,
    standalone,
}: {
    settings: PwaSettings;
    pathname: string;
    standalone: boolean;
}) {
    const allowed = settings.readerModeEnabled && standalone && isPwaReaderPath(pathname);
    const [open, setOpen] = useState(false);
    const { resolvedTheme } = useTheme();
    // Older installations defaulted to paper, even on a dark website.
    const initialTheme = settings.readerTheme === 'paper' ? 'system' : settings.readerTheme;
    const [theme, setTheme] = useState<PwaReaderTheme>(initialTheme);
    const readerTheme = theme === 'system' ? (resolvedTheme === 'dark' ? 'night' : 'paper') : theme;
    const [sizeIndex, setSizeIndex] = useState(1);
    const [vision, setVision] = useState(false);
    const [panel, setPanel] = useState(false);

    useEffect(() => {
        setOpen(false);
        setPanel(false);
    }, [allowed, pathname]);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as { theme?: PwaReaderTheme; size?: number; vision?: boolean };
            if (parsed.theme && isReaderTheme(parsed.theme)) setTheme(parsed.theme);
            if (typeof parsed.size === 'number') {
                const next = SIZES.findIndex((item) => item === parsed.size);
                setSizeIndex(next >= 0 ? next : 1);
            }
            if (typeof parsed.vision === 'boolean') setVision(parsed.vision);
        } catch {
            // Ignore stale localStorage.
        }
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        if (!allowed || !open) {
            delete root.dataset.pwaReader;
            delete root.dataset.pwaVision;
            root.style.removeProperty('--reader-scale');
            return;
        }
        root.dataset.pwaReader = readerTheme;
        if (vision) root.dataset.pwaVision = 'on';
        else delete root.dataset.pwaVision;
        root.style.setProperty('--reader-scale', String(SIZES[sizeIndex]));
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme, size: SIZES[sizeIndex], vision }));
        } catch {
            // Private mode.
        }
        return () => {
            delete root.dataset.pwaReader;
            delete root.dataset.pwaVision;
            root.style.removeProperty('--reader-scale');
        };
    }, [allowed, open, theme, readerTheme, sizeIndex, vision]);

    useEffect(() => {
        if (!panel) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setPanel(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [panel]);

    const closePanel = () => setPanel(false);

    const toggleVision = () => {
        setVision((current) => {
            const next = !current;
            if (next && sizeIndex < LOW_VISION_MIN_INDEX) setSizeIndex(LOW_VISION_MIN_INDEX);
            return next;
        });
    };

    if (!allowed) return null;

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    if (!open) {
                        setOpen(true);
                        setPanel(true);
                        return;
                    }
                    setPanel((value) => !value);
                }}
                className="fixed right-3 z-[142] grid size-11 place-items-center rounded-full border border-foreground/15 bg-background/95 text-foreground shadow-2xl backdrop-blur-xl"
                style={{ bottom: dock(standalone, 5.4) }}
                aria-pressed={open}
                aria-expanded={panel}
                aria-label={open ? (panel ? 'Hide reader options' : 'Reader options') : 'Open reader mode'}
            >
                <BookOpen className="size-4" />
            </button>

            {open && panel ? (
                <>
                    <button
                        type="button"
                        aria-label="Close reader options"
                        className="fixed inset-0 z-[142] cursor-default bg-transparent"
                        onClick={closePanel}
                    />
                    <div
                        role="dialog"
                        aria-label="Reader options"
                        className="fixed inset-x-3 z-[143] rounded-2xl border border-foreground/15 bg-background/95 px-2.5 py-2 text-foreground shadow-2xl backdrop-blur-xl sm:left-auto sm:right-3 sm:w-[22rem]"
                        style={{ bottom: dock(standalone, 8.55) }}
                    >
                        <div className="flex items-center gap-1">
                            <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                                {THEMES.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setTheme(item.id)}
                                        aria-pressed={theme === item.id}
                                        className={cn(
                                            'h-8 rounded-full border px-2.5 text-[10px]',
                                            theme === item.id ? 'border-foreground/40 bg-foreground/10' : 'border-foreground/15 text-muted-foreground',
                                        )}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                            <button type="button" onClick={closePanel} className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground" aria-label="Close reader options">
                                <X className="size-3.5" />
                            </button>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1">
                            <button type="button" onClick={() => setSizeIndex((value) => Math.max(0, value - 1))} className="grid size-8 place-items-center rounded-full" aria-label="Smaller type">
                                <Minus className="size-3.5" />
                            </button>
                            <span className="min-w-[3.5rem] text-center text-[10px] text-muted-foreground">Type</span>
                            <button type="button" onClick={() => setSizeIndex((value) => Math.min(SIZES.length - 1, value + 1))} className="grid size-8 place-items-center rounded-full" aria-label="Larger type">
                                <Plus className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={toggleVision}
                                aria-pressed={vision}
                                className={cn(
                                    'ml-1 inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-[10px]',
                                    vision ? 'border-foreground/40 bg-foreground/10' : 'border-foreground/15 text-muted-foreground',
                                )}
                            >
                                <Eye className="size-3.5" />
                                Low vision
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setOpen(false);
                                    setPanel(false);
                                }}
                                className="ml-auto h-8 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                            >
                                Off
                            </button>
                        </div>
                    </div>
                </>
            ) : null}
        </>
    );
}
