'use client';

import { useState } from 'react';
import { ChevronDown, Loader2, Sparkles } from 'lucide-react';
import type { Editor } from '@tiptap/react';
import { improveWithPretext, type PretextMode } from '@/app/admin/(protected)/pretext/actions';

const MODES: { mode: PretextMode; label: string; hint: string }[] = [
    { mode: 'improve', label: 'Improve writing', hint: 'Clearer, more professional copy' },
    { mode: 'tighten', label: 'Tighten', hint: 'Cut filler, keep the meaning' },
    { mode: 'expand', label: 'Expand', hint: 'Add useful detail without new claims' },
    { mode: 'grammar', label: 'Fix grammar', hint: 'Spelling and punctuation only' },
];

export function PretextMenu({
    editor,
    open,
    onOpenChange,
    hint = 'Select copy, then run Pretext — or rewrite the whole field.',
}: {
    editor: Editor | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    hint?: string;
}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const run = async (mode: PretextMode) => {
        if (!editor || busy) return;
        const selected = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ').trim();
        setBusy(true);
        setError('');
        onOpenChange(false);
        const result = await improveWithPretext({ html: selected || editor.getHTML(), mode });
        setBusy(false);
        if (!result.ok) {
            setError(result.error);
            return;
        }
        if (selected) editor.chain().focus().insertContent(result.html).run();
        else editor.chain().focus().setContent(result.html).run();
    };

    return (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className="relative">
                <button
                    type="button"
                    title="Pretext — improve writing"
                    aria-expanded={open}
                    disabled={busy || !editor}
                    onClick={() => onOpenChange(!open)}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-fuchsia-400/25 bg-fuchsia-400/[0.08] px-2.5 text-xs text-fuchsia-100 transition hover:border-fuchsia-300/40 hover:bg-fuchsia-400/[0.14] disabled:opacity-50"
                >
                    {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                    Pretext
                    <ChevronDown className="size-3 opacity-60" />
                </button>
                {open && (
                    <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-72 overflow-hidden rounded-xl border border-white/10 bg-[#151515] shadow-2xl">
                        {MODES.map((item) => (
                            <button
                                key={item.mode}
                                type="button"
                                onClick={() => run(item.mode)}
                                className="flex w-full flex-col px-3 py-2.5 text-left transition hover:bg-white/[0.05]"
                            >
                                <span className="text-sm text-white/85">{item.label}</span>
                                <span className="mt-0.5 text-[11px] text-white/35">{item.hint}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {error ? <p className="text-[11px] text-red-300">{error}</p> : <p className="text-[11px] text-white/30">{hint}</p>}
        </div>
    );
}
