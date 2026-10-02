export const BOOKING_CONFIG_SLUG = '_booking-addon-config';
export const BOOKING_ADDON_VERSION = '1.2.0';
export type BookingService = { id: string; title: string; description: string; duration: number; path: string };
export type BookingConfig = { installed: boolean; active: boolean; packageVersion: string; title: string; description: string; services: BookingService[]; reminderHours: number; autoProject: boolean };
export function calOrigin(value: string | undefined): string | null {
    try {
        const url = new URL(value?.trim() || '');
        if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
        return url.origin;
    } catch { return null; }
}
export function calBookingPath(value: unknown): string {
    return typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{0,79}\/[a-z0-9][a-z0-9_-]{0,79}$/.test(value.trim()) ? value.trim() : '';
}
export function normalizeBookingConfig(value: unknown): BookingConfig {
    const raw = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
    const text = (value: unknown, fallback: string, max: number) => typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : fallback;
    const services: BookingService[] = Array.isArray(raw.services) ? raw.services.slice(0, 8).flatMap((item, index) => {
        if (!item || typeof item !== 'object') return [];
        const service = item as Record<string, unknown>;
        const path = calBookingPath(service.path);
        if (!path) return [];
        return [{ id: `service-${index}`, path, title: text(service.title, 'Consultation', 120), description: text(service.description, '', 400), duration: Math.max(5, Math.min(480, Number(service.duration) || 30)) }];
    }) : [];
    return { installed: raw.installed === true, active: raw.active === true && raw.installed === true,
        packageVersion: text(raw.packageVersion, BOOKING_ADDON_VERSION, 20),
        title: text(raw.title, 'Let’s find a time.', 120), description: text(raw.description, 'Choose a consultation, select an available time and tell me about your project.', 600), services, reminderHours: [1, 24, 48].includes(Number(raw.reminderHours)) ? Number(raw.reminderHours) : 0, autoProject: raw.autoProject === true };
}
export function bookingReady(config: BookingConfig, origin: string | null) {
    return config.installed && config.active && Boolean(origin) && config.services.length > 0;
}
export function bookingEmbedUrl(origin: string, path: string, theme: 'light' | 'dark', language: 'en' | 'bg') {
    const safeOrigin = calOrigin(origin);
    const safePath = calBookingPath(path);
    if (!safeOrigin || !safePath) throw new Error('Invalid booking destination');
    const url = new URL(`/${safePath}`, safeOrigin);
    url.searchParams.set('embed', 'necrotixlab');
    url.searchParams.set('layout', 'month_view');
    url.searchParams.set('theme', theme);
    url.searchParams.set('locale', language);
    return url.toString();
}
