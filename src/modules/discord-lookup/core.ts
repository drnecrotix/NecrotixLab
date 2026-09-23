export type LookupKind = 'invite' | 'server' | 'user';
export function parseDiscordQuery(input: string, kind: LookupKind) {
    const value = input.trim();
    if (kind === 'server' || kind === 'user') {
        if (!/^\d{17,20}$/.test(value)) throw new Error(`Enter a valid Discord ${kind} ID.`);
        return value;
    }
    let code = value;
    if (value.startsWith('https://')) {
        const url = new URL(value);
        const host = url.hostname.toLowerCase();
        const path = url.pathname.split('/').filter(Boolean);
        if (host === 'discord.gg') code = path[0] || '';
        else if (['discord.com', 'www.discord.com', 'discordapp.com'].includes(host) && path[0] === 'invite') code = path[1] || '';
        else throw new Error('Enter a discord.gg or discord.com/invite link.');
    }
    if (!/^[a-zA-Z0-9-]{2,32}$/.test(code)) throw new Error('Enter a valid Discord invite code or link.');
    return code;
}
export function snowflakeDate(id: string) {
    const timestamp = (BigInt(id) >> 22n) + 1420070400000n;
    const date = new Date(Number(timestamp));
    return Number.isFinite(date.getTime()) && date.getTime() <= Date.now() + 86_400_000 ? date.toISOString() : null;
}
export function text(value: unknown): string { return typeof value === 'string' ? value.slice(0, 500) : ''; }
export function number(value: unknown): number | null { return typeof value === 'number' && Number.isFinite(value) ? value : null; }
