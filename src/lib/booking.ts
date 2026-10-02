// Only an operator-configured destination can receive visitors. No user-supplied redirects.
export function bookingDestination(value: string | undefined): string | null {
    if (!value?.trim()) return null;
    try {
        const url = new URL(value.trim());
        if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return null;
        return url.toString();
    } catch {
        return null;
    }
}
