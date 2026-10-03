/** Next may reconstruct request.url using an internal hostname. Host is the browser-facing authority. */
export function bookingSameOrigin(request: Request) {
    const value = request.headers.get('origin'); if (!value) return false;
    try {
        const origin = new URL(value); const internal = new URL(request.url);
        const host = request.headers.get('host') || internal.host;
        const protocol = (request.headers.get('x-forwarded-proto') || internal.protocol.slice(0, -1)).split(',')[0].trim();
        if (!['http', 'https'].includes(protocol) || /[\s,/@?#]/.test(host)) return false;
        const expected = new URL(`${protocol}://${host}`);
        return !origin.username && !origin.password && !origin.search && !origin.hash && origin.pathname === '/' && origin.origin === expected.origin;
    } catch { return false; }
}
