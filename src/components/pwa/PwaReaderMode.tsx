'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Eye, Minus, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PwaReaderTheme, PwaSettings } from '@/lib/pwa-settings';

const THEMES: Array<{ id: PwaReaderTheme; label: string }> = [
    { id: 'paper', label: 'Paper' },
    { id: 'sepia', label: 'Sepia' },
    { id: 'night', label: 'Night' },
    { id: 'system', label: 'Sys' },
];

const SIZES = [0.92, 1, 1.12, 1.26, 1.5, 1.78] as const;
const LOW_VISION_MIN_INDEX = 4;
const STORAGE_KEY = 'pwa-reader';

function isJournalArticle(pathname: string) {
    return /^\/blog\/[^/]+$/.test(pathname);
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
    const allowed = settings.readerModeEnabled && isJournalArticle(pathname);
    const [open, setOpen] = useState(false);
    const [theme, setTheme] = useState<PwaReaderTheme>(settings.readerTheme);
    const [sizeIndex, setSizeIndex] = useState(1);
    const [vision, setVision] = useState(false);
    const [panel, setPanel] = useState(false);

    useEffect(() => {
        if (!allowed) setPanel(false);
    }, [allowed]);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as { open?: boolean; theme?: PwaReaderTheme; size?: number; vision?: boolean };
            if (parsed.theme && THEMES.some((item) => item.id === parsed.theme)) setTheme(parsed.theme);
            if (typeof parsed.size === 'number') {
                const next = SIZES.findIndex((item) => item === parsed.size);
                setSizeIndex(next >= 0 ? next : 1);
            }
            if (typeof parsed.vision === 'boolean') setVision(parsed.vision);
            if (parsed.open && allowed) setOpen(true);
        } catch {
            // Ignore stale localStorage.
        }
    }, [allowed]);

    useEffect(() => {
        const root = document.documentElement;
        if (!allowed || !open) {
            delete root.dataset.pwaReader;
            delete root.dataset.pwaVision;
            root.style.removeProperty('--reader-scale');
            return;
        }
        root.dataset.pwaReader = theme;
        if (vision) root.dataset.pwaVision = 'on';
        else delete root.dataset.pwaVision;
        root.style.setProperty('--reader-scale', String(SIZES[sizeIndex]));
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ open, theme, size: SIZES[sizeIndex], vision }));
        } catch {
            // Private mode.
        }
        return () => {
            delete root.dataset.pwaReader;
            delete root.dataset.pwaVision;
            root.style.removeProperty('--reader-scale');
        };
    }, [allowed, open, theme, sizeIndex, vision]);

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
                className="fixed right-3 z-[142] grid size-11 place-items-center rounded-full border border-white/10 bg-black/75 text-white shadow-2xl backdrop-blur-xl"
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
                        className="fixed inset-x-3 z-[143] rounded-2xl border border-white/10 bg-black/88 px-2.5 py-2 text-white shadow-2xl backdrop-blur-xl sm:left-auto sm:right-3 sm:w-[22rem]"
                        style={{ bottom: dock(standalone, 8.55) }}
                    >
                        <div className="flex items-center gap-1">
                            <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                                {THEMES.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setTheme(item.id)}
                                        className={cn(
                                            'h-8 rounded-full border px-2.5 text-[10px]',
                                            theme === item.id ? 'border-white/40 bg-white/15' : 'border-white/10 text-white/60',
                                        )}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                            <button type="button" onClick={closePanel} className="grid size-8 shrink-0 place-items-center rounded-full text-white/70" aria-label="Close reader options">
                                <X className="size-3.5" />
                            </button>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1">
                            <button type="button" onClick={() => setSizeIndex((value) => Math.max(0, value - 1))} className="grid size-8 place-items-center rounded-full" aria-label="Smaller type">
                                <Minus className="size-3.5" />
                            </button>
                            <span className="min-w-[3.5rem] text-center text-[10px] text-white/55">Type</span>
                            <button type="button" onClick={() => setSizeIndex((value) => Math.min(SIZES.length - 1, value + 1))} className="grid size-8 place-items-center rounded-full" aria-label="Larger type">
                                <Plus className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={toggleVision}
                                aria-pressed={vision}
                                className={cn(
                                    'ml-1 inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-[10px]',
                                    vision ? 'border-white/40 bg-white/15' : 'border-white/10 text-white/60',
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
                                className="ml-auto h-8 px-2 text-[10px] text-white/45 hover:text-white/80"
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
