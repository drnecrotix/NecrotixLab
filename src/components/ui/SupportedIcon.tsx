'use client';

import { lazy, Suspense, type ComponentProps, type ComponentType } from 'react';
import {
    Accessibility, Binary, Blocks, DraftingCompass, FileCheck2, FileCode2,
    FileText, Globe2, HeartPulse, ImageIcon, Route, ScanSearch, SearchCode,
    ShieldAlert, ShieldCheck, Video, Workflow,
    type LucideProps,
} from 'lucide-react';

const commonIcons: Record<string, ComponentType<LucideProps>> = {
    accessibility: Accessibility,
    binary: Binary,
    blocks: Blocks,
    'drafting-compass': DraftingCompass,
    'file-check': FileCheck2,
    'file-code': FileCode2,
    'file-text': FileText,
    globe: Globe2,
    'heart-pulse': HeartPulse,
    image: ImageIcon,
    route: Route,
    'scan-search': ScanSearch,
    'search-code': SearchCode,
    'shield-alert': ShieldAlert,
    'shield-check': ShieldCheck,
    video: Video,
    wrench: Workflow,
};

const DynamicIcon = lazy(() => import('./SupportedIconDynamic'));

export function SupportedIcon({ name, ...props }: { name: string } & ComponentProps<ComponentType<LucideProps>>) {
    const Icon = commonIcons[name];
    if (Icon) return <Icon {...props} />;
    return <Suspense fallback={<span aria-hidden="true" className={props.className} />}><DynamicIcon name={name} {...props} /></Suspense>;
}
