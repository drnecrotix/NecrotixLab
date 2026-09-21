'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function CopyButton({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);
    return <button type="button" disabled={!value} onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs font-bold disabled:opacity-35">{copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}{copied ? 'Copied' : 'Copy'}</button>;
}
