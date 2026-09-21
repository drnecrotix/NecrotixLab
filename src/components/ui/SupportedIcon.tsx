'use client';

import { lazy, Suspense, type ComponentProps, type ComponentType } from 'react';
import {
    Accessibility, Binary, Blocks, Braces, Combine, DraftingCompass, Eraser,
    FileCheck2, FileCode2, FileDiff, FileImage, FileJson, FileScan, FileText,
    Fingerprint, Globe2, HeartPulse, ImageIcon, ImagePlus, ListOrdered, PenLine,
    Route, ScanSearch, Scissors, SearchCode, ShieldAlert, ShieldCheck, Shrink,
    Stamp, Video, Workflow,
    type LucideProps,
} from 'lucide-react';

const commonIcons: Record<string, ComponentType<LucideProps>> = {
    accessibility: Accessibility,
    binary: Binary,
    blocks: Blocks,
    braces: Braces,
    combine: Combine,
    'drafting-compass': DraftingCompass,
    eraser: Eraser,
    'file-check': FileCheck2,
    'file-code': FileCode2,
    'file-diff': FileDiff,
    'file-image': FileImage,
    'file-json': FileJson,
    'file-scan': FileScan,
    'file-text': FileText,
    fingerprint: Fingerprint,
    globe: Globe2,
    'heart-pulse': HeartPulse,
    image: ImageIcon,
    'image-plus': ImagePlus,
    'list-ordered': ListOrdered,
    'pen-line': PenLine,
    route: Route,
    'scan-search': ScanSearch,
    scissors: Scissors,
    'search-code': SearchCode,
    'shield-alert': ShieldAlert,
    'shield-check': ShieldCheck,
    shrink: Shrink,
    stamp: Stamp,
    video: Video,
    wrench: Workflow,
};

const DynamicIcon = lazy(() => import('./SupportedIconDynamic'));

export function SupportedIcon({ name, ...props }: { name: string } & ComponentProps<ComponentType<LucideProps>>) {
    const Icon = commonIcons[name];
    if (Icon) return <Icon {...props} />;
    return <Suspense fallback={<span aria-hidden="true" className={props.className} />}><DynamicIcon name={name} {...props} /></Suspense>;
}
