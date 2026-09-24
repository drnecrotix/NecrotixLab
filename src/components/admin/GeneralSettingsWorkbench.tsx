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
