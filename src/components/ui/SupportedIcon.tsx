'use client';

import { lazy, Suspense, type ComponentProps, type ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import { getSupportedIconImport } from '@/lib/icon-library';

const cache = new Map<string, ComponentType<LucideProps>>();

function resolveIcon(name: string) {
    const cached = cache.get(name);
    if (cached) return cached;
    const Icon = lazy(getSupportedIconImport(name));
    cache.set(name, Icon);
    return Icon;
}

export function SupportedIcon({ name, ...props }: { name: string } & ComponentProps<ComponentType<LucideProps>>) {
    const Icon = resolveIcon(name);
    return <Suspense fallback={<span aria-hidden="true" className={props.className} />}><Icon {...props} /></Suspense>;
}
