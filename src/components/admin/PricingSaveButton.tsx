'use client';

import { useFormStatus } from 'react-dom';

export function PricingSaveButton() {
    const { pending } = useFormStatus();
    return <button type="submit" disabled={pending} aria-busy={pending} className="min-h-11 w-full rounded-lg bg-foreground px-5 py-3 text-sm font-semibold text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-60 sm:w-auto">
        {pending ? 'Saving prices…' : 'Save all prices'}
    </button>;
}
