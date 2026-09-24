export const BUNDLED_ADDONS = [
    { id: 'discord-lookup', name: 'Discord Lookup', area: 'Community', description: 'Profiles, public invites and server information.', href: '/tools/discord-lookup' },
    { id: 'exif-tool', name: 'EXIF Tool', area: 'Media', description: 'Inspect and edit image metadata locally.', href: '/tools/exif-tool' },
    { id: 'social-video', name: 'Video Download', area: 'Media', description: 'Inspect public video posts and download available files.', href: '/tools/video-download' },
    { id: 'gcode-editor', name: 'G-Code Editor', area: 'Engineering', description: 'Edit and simulate CNC programs in the browser.', href: '/tools/gcode-editor' },
] as const;

export type BundledAddonId = typeof BUNDLED_ADDONS[number]['id'];

export function isBundledAddonId(value: string): value is BundledAddonId {
    return BUNDLED_ADDONS.some((addon) => addon.id === value);
}
