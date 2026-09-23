import { isIP } from 'node:net';

export function clientIp(headers: Headers): string | null {
    const candidates = [headers.get('cf-connecting-ip'), headers.get('x-real-ip'), headers.get('x-forwarded-for')?.split(',')[0]];
    for (const candidate of candidates) {
        const value = candidate?.trim() || '';
        const normalized = value.startsWith('::ffff:') && isIP(value.slice(7)) === 4 ? value.slice(7) : value;
        if (isIP(normalized)) return normalized;
    }
    return null;
}
