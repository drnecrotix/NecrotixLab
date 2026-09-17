export const PWA_CLIENT_PREFS_KEY = 'pwa-client-prefs';

export type PwaClientAppearance = 'day' | 'night';

export type PwaClientPrefs = {
    appearance: PwaClientAppearance;
    haptics: boolean;
    pullToRefresh: boolean;
};

export const defaultPwaClientPrefs: PwaClientPrefs = {
    appearance: 'night',
    haptics: true,
    pullToRefresh: true,
};

export function appearanceToTheme(appearance: PwaClientAppearance): 'light' | 'dark' {
    return appearance === 'day' ? 'light' : 'dark';
}

export function themeToAppearance(theme: string | undefined): PwaClientAppearance {
    return theme === 'light' ? 'day' : 'night';
}

export function readPwaClientPrefs(): PwaClientPrefs {
    if (typeof window === 'undefined') return defaultPwaClientPrefs;
    try {
        const raw = window.localStorage.getItem(PWA_CLIENT_PREFS_KEY);
        if (!raw) return defaultPwaClientPrefs;
        const parsed = JSON.parse(raw) as Partial<PwaClientPrefs>;
        return {
            appearance: parsed.appearance === 'day' ? 'day' : 'night',
            haptics: typeof parsed.haptics === 'boolean' ? parsed.haptics : true,
            pullToRefresh: typeof parsed.pullToRefresh === 'boolean' ? parsed.pullToRefresh : true,
        };
    } catch {
        return defaultPwaClientPrefs;
    }
}

export function writePwaClientPrefs(prefs: PwaClientPrefs) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(PWA_CLIENT_PREFS_KEY, JSON.stringify(prefs));
        window.dispatchEvent(new CustomEvent('pwa-client-prefs', { detail: prefs }));
    } catch {
        // Private mode.
    }
}
