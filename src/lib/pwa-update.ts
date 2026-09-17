export const PWA_VERSION_STORAGE_KEY = 'pwa-app-version';
export const PWA_UPDATE_DISMISS_KEY = 'pwa-update-dismissed';
export const PWA_UPDATE_CHECK_MS = 5 * 60 * 1000;

export function parsePwaVersionPayload(payload: unknown) {
    if (!payload || typeof payload !== 'object') return '';
    const version = (payload as { version?: unknown }).version;
    return typeof version === 'string' ? version.trim() : '';
}

/** First run stores the version silently. Later mismatches mean a new release is on the server. */
export function shouldOfferPwaUpdate(knownVersion: string | null | undefined, remoteVersion: string | null | undefined) {
    if (!remoteVersion || remoteVersion === 'unknown') return false;
    if (!knownVersion) return false;
    return knownVersion !== remoteVersion;
}
