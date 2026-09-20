import dynamicIconImports from 'lucide-react/dynamicIconImports';

export const SUPPORTED_ICON_NAMES = Object.keys(dynamicIconImports).sort();
export const SUPPORTED_ICON_COUNT = SUPPORTED_ICON_NAMES.length;
export type SupportedIconName = string;

const supportedIconSet = new Set(SUPPORTED_ICON_NAMES);

export function isSupportedIcon(value: unknown): value is SupportedIconName {
    return typeof value === 'string' && supportedIconSet.has(value);
}

export function getSupportedIconImport(name: string) {
    return isSupportedIcon(name) ? dynamicIconImports[name as keyof typeof dynamicIconImports] : dynamicIconImports.wrench;
}
