export const PWA_ICON_96 = '/pwa/icon-96.png';
export const PWA_ICON_180 = '/pwa/icon-180.png';
export const PWA_ICON_192 = '/pwa/icon-192.png';
export const PWA_ICON_512 = '/pwa/icon-512.png';
export const PWA_ICON_MASKABLE = '/pwa/icon-maskable-512.png';
export const PWA_ICON_MONOCHROME = '/pwa/icon-monochrome-512.png';
export const PWA_SCREENSHOT_NARROW = '/pwa/screenshot-narrow.png';
export const PWA_SCREENSHOT_WIDE = '/pwa/screenshot-wide.png';

export const PWA_ICON_KINDS = ['96', '180', '192', '512', '192-maskable', '512-maskable', 'monochrome'] as const;
export type PwaIconKind = (typeof PWA_ICON_KINDS)[number];

type AppleDevice = {
    width: number;
    height: number;
    ratio: number;
};

/** Unique CSS portrait viewports × pixel ratio. Media queries keep portrait width/height. */
const APPLE_DEVICES: AppleDevice[] = [
    { width: 320, height: 568, ratio: 2 },
    { width: 375, height: 667, ratio: 2 },
    { width: 414, height: 736, ratio: 3 },
    { width: 375, height: 812, ratio: 3 },
    { width: 414, height: 896, ratio: 2 },
    { width: 414, height: 896, ratio: 3 },
    { width: 390, height: 844, ratio: 3 },
    { width: 393, height: 852, ratio: 3 },
    { width: 402, height: 874, ratio: 3 },
    { width: 428, height: 926, ratio: 3 },
    { width: 430, height: 932, ratio: 3 },
    { width: 440, height: 956, ratio: 3 },
    { width: 420, height: 912, ratio: 3 },
    { width: 768, height: 1024, ratio: 2 },
    { width: 834, height: 1194, ratio: 2 },
    { width: 1024, height: 1366, ratio: 2 },
];

export type AppleSplashEntry = {
    href: string;
    media: string;
    pixelWidth: number;
    pixelHeight: number;
    orientation: 'portrait' | 'landscape';
};

export function appleSplashEntries(): AppleSplashEntry[] {
    const entries: AppleSplashEntry[] = [];
    for (const device of APPLE_DEVICES) {
        for (const orientation of ['portrait', 'landscape'] as const) {
            const pixelWidth = (orientation === 'portrait' ? device.width : device.height) * device.ratio;
            const pixelHeight = (orientation === 'portrait' ? device.height : device.width) * device.ratio;
            entries.push({
                pixelWidth,
                pixelHeight,
                orientation,
                href: `/pwa/apple-splash/${pixelWidth}x${pixelHeight}`,
                media: `screen and (device-width: ${device.width}px) and (device-height: ${device.height}px) and (-webkit-device-pixel-ratio: ${device.ratio}) and (orientation: ${orientation})`,
            });
        }
    }
    return entries;
}

export function appleSplashStartupImages() {
    return appleSplashEntries().map((entry) => ({ url: entry.href, media: entry.media }));
}

export function parseSplashSize(value: string) {
    const match = /^(\d{3,4})x(\d{3,4})$/.exec(value);
    if (!match) return null;
    const width = Number(match[1]);
    const height = Number(match[2]);
    if (width < 320 || height < 320 || width > 3200 || height > 3200) return null;
    const allowed = appleSplashEntries().some((entry) => entry.pixelWidth === width && entry.pixelHeight === height);
    return allowed ? { width, height } : null;
}

export function isPwaIconKind(value: string): value is PwaIconKind {
    return (PWA_ICON_KINDS as readonly string[]).includes(value);
}

export function staticIconForKind(kind: PwaIconKind) {
    if (kind === '96') return PWA_ICON_96;
    if (kind === '180') return PWA_ICON_180;
    if (kind === '192' || kind === '192-maskable') return kind === '192' ? PWA_ICON_192 : PWA_ICON_MASKABLE;
    if (kind === 'monochrome') return PWA_ICON_MONOCHROME;
    return kind === '512-maskable' ? PWA_ICON_MASKABLE : PWA_ICON_512;
}
