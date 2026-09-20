'use client';
import { useFormStatus } from 'react-dom';

export function SettingsSaveButton({ children }: { children: React.ReactNode }) {
    const { pending } = useFormStatus();
    return <button disabled={pending} aria-busy={pending} className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-50">{pending ? 'Saving...' : children}</button>;
}
