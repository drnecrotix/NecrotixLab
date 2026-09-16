'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Minus, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PwaReaderTheme, PwaSettings } from '@/lib/pwa-settings';

const THEMES: Array<{ id: PwaReaderTheme; label: string }> = [
    { id: 'paper', label: 'Paper' },
    { id: 'sepia', label: 'Sepia' },
    { id: 'night', label: 'Night' },
    { id: 'system', label: 'System' },
];

const SIZES = [0.92, 1, 1.12, 1.26] as const;

function isJournalArticle(pathname: string) {
    return /^\/blog\/[^/]+$/.test(pathname);
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
    const enabled = standalone && settings.readerModeEnabled && isJournalArticle(pathname);
    const [open, setOpen] = useState(false);
    const [theme, setTheme] = useState<PwaReaderTheme>(settings.readerTheme);
    const [sizeIndex, setSizeIndex] = useState(1);
    const [panel, setPanel] = useState(false);

    useEffect(() => {
        if (!enabled) {
            setOpen(false);
            setPanel(false);
        }
    }, [enabled]);

    useEffect(() => {
        try {
            const raw = window.localStorage.getItem('pwa-reader');
            if (!raw) return;
            const parsed = JSON.parse(raw) as { open?: boolean; theme?: PwaReaderTheme; size?: number };
            if (parsed.theme && THEMES.some((item) => item.id === parsed.theme)) setTheme(parsed.theme);
            if (typeof parsed.size === 'number') {
                const next = SIZES.findIndex((item) => item === parsed.size);
                setSizeIndex(next >= 0 ? next : 1);
            }
            if (parsed.open && enabled) setOpen(true);
        } catch {
            // Ignore stale localStorage.
        }
    }, [enabled]);

    useEffect(() => {
        const root = document.documentElement;
        if (!enabled || !open) {
            delete root.dataset.pwaReader;
            root.style.removeProperty('--reader-scale');
            return;
        }
        root.dataset.pwaReader = theme;
        root.style.setProperty('--reader-scale', String(SIZES[sizeIndex]));
        try {
            window.localStorage.setItem('pwa-reader', JSON.stringify({ open, theme, size: SIZES[sizeIndex] }));
        } catch {
            // Private mode.
        }
        return () => {
            delete root.dataset.pwaReader;
            root.style.removeProperty('--reader-scale');
        };
    }, [enabled, open, theme, sizeIndex]);

    if (!enabled) return null;

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    if (open) {
                        setPanel((value) => !value);
                    } else {
                        setOpen(true);
                        setPanel(true);
                    }
                }}
                className="fixed right-3 z-[142] grid size-11 place-items-center rounded-full border border-white/10 bg-black/75 text-white shadow-2xl backdrop-blur-xl"
                style={{ bottom: 'calc(5.4rem + env(safe-area-inset-bottom, 0px))' }}
                aria-pressed={open}
                aria-label={open ? 'Reader options' : 'Open reader mode'}
            >
                <BookOpen className="size-4" />
            </button>

            {open && panel ? (
                <div
                    className="fixed inset-x-3 z-[143] rounded-2xl border border-white/10 bg-black/85 p-3 text-white shadow-2xl backdrop-blur-xl sm:left-auto sm:right-3 sm:w-[320px]"
                    style={{ bottom: 'calc(8.6rem + env(safe-area-inset-bottom, 0px))' }}
                >
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold">Reader</p>
                        <button type="button" onClick={() => { setOpen(false); setPanel(false); }} className="grid size-8 place-items-center rounded-full text-white/70" aria-label="Exit reader mode">
                            <X className="size-4" />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {THEMES.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setTheme(item.id)}
                                className={cn(
                                    'rounded-full border px-2.5 py-1 text-[10px]',
                                    theme === item.id ? 'border-white/40 bg-white/15' : 'border-white/10 text-white/60',
                                )}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 px-2 py-1">
                        <button type="button" onClick={() => setSizeIndex((value) => Math.max(0, value - 1))} className="grid size-9 place-items-center" aria-label="Smaller type">
                            <Minus className="size-3.5" />
                        </button>
                        <span className="text-[11px] text-white/70">Type size</span>
                        <button type="button" onClick={() => setSizeIndex((value) => Math.min(SIZES.length - 1, value + 1))} className="grid size-9 place-items-center" aria-label="Larger type">
                            <Plus className="size-3.5" />
                        </button>
                    </div>
                </div>
            ) : null}
        </>
    );
}
