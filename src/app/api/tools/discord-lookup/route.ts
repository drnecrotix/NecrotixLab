import { NextRequest, NextResponse } from 'next/server';
import { number, parseDiscordQuery, snowflakeDate, text, type LookupKind } from '@/modules/discord-lookup/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const attempts = new Map<string, { count: number; until: number }>();
const api = 'https://discord.com/api/v10';
type Data = Record<string, unknown>;
function object(value: unknown): Data { return value && typeof value === 'object' && !Array.isArray(value) ? value as Data : {}; }
function cdnAvatar(id: string, hash: string, kind: 'avatars' | 'icons' | 'banners') {
    return id && /^[a-f0-9_]{1,128}$/i.test(hash) ? `https://cdn.discordapp.com/${kind}/${id}/${hash}.${hash.startsWith('a_') ? 'gif' : 'png'}?size=256` : null;
}
function cdnAsset(id: string, hash: string, kind: 'splashes' | 'discovery-splashes' | 'avatar-decorations') {
    return id && /^[a-f0-9_]{1,128}$/i.test(hash) ? `https://cdn.discordapp.com/${kind}/${id}/${hash}.png?size=512` : null;
}
async function discord(path: string, token?: string) {
    const response = await fetch(`${api}${path}`, { signal: AbortSignal.timeout(8000), headers: { accept: 'application/json', ...(token ? { authorization: `Bot ${token}` } : {}) }, cache: 'no-store' });
    if (!response.ok) throw new Error(response.status === 404 ? 'Discord record not found or not public.' : response.status === 429 ? 'Discord rate limit reached. Try again shortly.' : 'Discord API unavailable for this lookup.');
    return object(await response.json());
}
export async function GET(request: NextRequest) {
    const kind = request.nextUrl.searchParams.get('kind') as LookupKind;
    if (!['invite', 'server', 'user'].includes(kind)) return NextResponse.json({ error: 'Choose invite, server or user lookup.' }, { status: 400 });
    let query: string;
    try { query = parseDiscordQuery(request.nextUrl.searchParams.get('q') || '', kind); }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid input.' }, { status: 400 }); }
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now(), entry = attempts.get(ip);
    if (attempts.size > 1000) for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
    if (entry && entry.until > now) { if (++entry.count > 15) return NextResponse.json({ error: 'Too many lookups. Try again in a minute.' }, { status: 429 }); }
    else attempts.set(ip, { count: 1, until: now + 60_000 });
    try {
        if (kind === 'invite') {
            const data = await discord(`/invites/${encodeURIComponent(query)}?with_counts=true`), guild = object(data.guild), channel = object(data.channel);
            return NextResponse.json({ kind, code: text(data.code), url: `https://discord.gg/${encodeURIComponent(query)}`, server: { id: text(guild.id), name: text(guild.name), description: text(guild.description), iconUrl: cdnAvatar(text(guild.id), text(guild.icon), 'icons'), bannerUrl: cdnAvatar(text(guild.id), text(guild.banner), 'banners'), splashUrl: cdnAsset(text(guild.id), text(guild.splash), 'splashes'), discoverySplashUrl: cdnAsset(text(guild.id), text(guild.discovery_splash), 'discovery-splashes'), vanityUrl: text(guild.vanity_url_code) ? `https://discord.gg/${encodeURIComponent(text(guild.vanity_url_code))}` : null, verificationLevel: number(guild.verification_level), features: Array.isArray(guild.features) ? guild.features.filter((v): v is string => typeof v === 'string').slice(0, 30) : [], members: number(data.approximate_member_count), online: number(data.approximate_presence_count), created: text(guild.id) ? snowflakeDate(text(guild.id)) : null }, channel: text(channel.name), channelType: number(channel.type), expires: text(data.expires_at), inviteUses: number(data.uses), maxUses: number(data.max_uses), note: 'Counts are approximate. Only information exposed by this public invite is shown.' }, { headers: { 'Cache-Control': 'no-store' } });
        }
        if (kind === 'server') {
            const data = await discord(`/guilds/${query}/widget.json`);
            return NextResponse.json({ kind, server: { id: query, name: text(data.name), iconUrl: `https://cdn.discordapp.com/guilds/${query}/widget.png?style=banner2`, online: number(data.presence_count), created: snowflakeDate(query), invite: text(data.instant_invite), channels: Array.isArray(data.channels) ? data.channels.length : 0 }, note: 'The server must enable its public widget. Its image is the public widget badge; this endpoint does not expose the server icon or banner.' }, { headers: { 'Cache-Control': 'no-store' } });
        }
        if (!process.env.DISCORD_BOT_TOKEN) return NextResponse.json({ kind, user: { id: query, username: '', displayName: '', avatar: '', bot: null, created: snowflakeDate(query) }, note: 'Creation time is decoded from the ID. This does not verify that the account exists. Profile fields require a bot token.', profileUrl: `https://discord.com/users/${query}` }, { headers: { 'Cache-Control': 'no-store' } });
        const data = await discord(`/users/${query}`, process.env.DISCORD_BOT_TOKEN);
        const decoration = object(data.avatar_decoration_data), primaryGuild = object(data.primary_guild);
        return NextResponse.json({ kind, user: { id: query, username: text(data.username), displayName: text(data.global_name), discriminator: text(data.discriminator) === '0' ? null : text(data.discriminator), avatarUrl: cdnAvatar(query, text(data.avatar), 'avatars') || `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(query) >> 22n) % 6}.png`, hasCustomAvatar: Boolean(data.avatar), bannerUrl: cdnAvatar(query, text(data.banner), 'banners'), decorationAsset: text(decoration.asset), accentColor: number(data.accent_color), bot: data.bot === true, system: data.system === true, publicFlags: number(data.public_flags), primaryGuildTag: text(primaryGuild.tag), primaryGuildId: text(primaryGuild.identity_guild_id), created: snowflakeDate(query) }, note: 'Only profile fields available to the configured bot are shown. If no custom avatar exists, the default Discord avatar is shown.', profileUrl: `https://discord.com/users/${query}` }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Discord lookup failed.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } }); }
}
