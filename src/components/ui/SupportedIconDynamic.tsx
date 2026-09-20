'use client';

import { lazy, Suspense, type ComponentProps, type ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import { getSupportedIconImport } from '@/lib/icon-library';

const cache = new Map<string, ComponentType<LucideProps>>();

export default function SupportedIconDynamic({ name, ...props }: { name: string } & ComponentProps<ComponentType<LucideProps>>) {
    let Icon = cache.get(name);
    if (!Icon) {
        Icon = lazy(getSupportedIconImport(name));
        cache.set(name, Icon);
    }
    return <Suspense fallback={<span aria-hidden="true" className={props.className} />}><Icon {...props} /></Suspense>;
}
