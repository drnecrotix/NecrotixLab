'use client';

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
    AtSign,
    Check,
    Clock3,
    ExternalLink,
    Eye,
    EyeOff,
    Globe2,
    Mail,
    MapPin,
    Palette,
    Settings2,
    ShieldCheck,
    Smartphone,
    SunMoon,
} from 'lucide-react';
import { MediaPicker } from '@/components/admin/MediaPicker';
import { SettingsSaveButton } from './SettingsSaveButton';
import { AdminPreferences } from './AdminPreferences';
import type { GeneralSiteSettings } from '@/lib/site-settings';
import { updateGeneralSettings, updatePageAccessSettings } from '@/app/admin/(protected)/settings/actions';

type SectionId = 'identity' | 'appearance' | 'access' | 'contact' | 'social' | 'regional';
type AccessKey = 'wiki' | 'blog' | 'gallery' | 'store' | 'projects' | 'journey' | 'resume';
type AccessValue = 'PUBLIC' | 'ADMIN_ONLY' | 'DISABLED';
type AccessSettings = Record<AccessKey, AccessValue>;

const input = 'mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25 focus:bg-white/[0.035]';

const sections: Array<{ id: SectionId; label: string; hint: string; icon: typeof Settings2 }> = [
    { id: 'identity', label: 'Identity', hint: 'Name, description, favicon', icon: Globe2 },
    { id: 'appearance', label: 'Appearance', hint: 'Theme and accent', icon: Palette },
    { id: 'access', label: 'Page access', hint: 'Public route availability', icon: ShieldCheck },
    { id: 'contact', label: 'Contact', hint: 'Public and delivery details', icon: Mail },
    { id: 'social', label: 'Social', hint: 'Connected public profiles', icon: AtSign },
    { id: 'regional', label: 'Regional', hint: 'Locale and timezone', icon: Clock3 },
];

const accessMeta: Record<AccessKey, { title: string; path: string; description: string }> = {
    wiki: { title: 'Wiki', path: '/wiki', description: 'Wiki index, articles and FAQ pages.' },
    blog: { title: 'Blog', path: '/blog', description: 'Journal archive and public publications.' },
    gallery: { title: 'Gallery', path: '/gallery', description: 'Gallery index and individual works.' },
    store: { title: 'Store', path: '/store', description: 'Catalog, product pages and checkout entry points.' },
    projects: { title: 'Projects', path: '/projects', description: 'Portfolio index and individual project pages.' },
    journey: { title: 'Journey', path: '/journey', description: 'Experience and career timeline (/journey and /experience).' },
    resume: { title: 'Resume', path: '/resume', description: 'Public resume and career dossier.' },
};

const accessOptions: Array<{ value: AccessValue; label: string; icon: typeof Eye }> = [
    { value: 'PUBLIC', label: 'Public', icon: Eye },
    { value: 'ADMIN_ONLY', label: 'Admin only', icon: ShieldCheck },
    { value: 'DISABLED', label: 'Off', icon: EyeOff },
];
