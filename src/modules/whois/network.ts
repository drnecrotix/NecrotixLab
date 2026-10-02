import { isIP } from 'node:net';

// Restrict probes to globally routable unicast addresses, including canonical IPv6.
export function isProbeAddress(address: string): boolean {
    if (isIP(address) === 4) {
        const [a, b, c] = address.split('.').map(Number);
        return !(a === 0 || a === 10 || a === 127 || a >= 224
            || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254)
            || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99)))
            || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113));
    }
    if (isIP(address) !== 6 || address.includes('%')) return false;
    const canonical = new URL(`http://[${address}]/`).hostname.slice(1, -1);
    const first = parseInt(canonical.split(':')[0], 16);
    return first >= 0x2000 && first <= 0x3fff && !canonical.startsWith('2001:db8:')
        && !canonical.startsWith('2001:') && !canonical.startsWith('2002:');
}
