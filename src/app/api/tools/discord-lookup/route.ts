import { NextRequest, NextResponse } from 'next/server';
import { number, parseDiscordQuery, snowflakeDate, text, type LookupKind } from '@/modules/discord-lookup/core';
import { getDiscordLookupCredentials } from '@/lib/discord-credentials';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const attempts = new Map<string, { count: number; until: number }>();
const api = 'https://discord.com/api/v10';
type Data = Record<string, unknown>;
class DiscordApiError extends Error {
    constructor(readonly status: number, message: string) { super(message); }
}
function object(value: unknown): Data { return value && typeof value === 'object' && !Array.isArray(value) ? value as Data : {}; }
function cdnAvatar(id: string, hash: string, kind: 'avatars' | 'icons' | 'banners') {
    return id && /^[a-f0-9_]{1,128}$/i.test(hash) ? `https://cdn.discordapp.com/${kind}/${id}/${hash}.${hash.startsWith('a_') ? 'gif' : 'png'}?size=256` : null;
}
function cdnAsset(id: string, hash: string, kind: 'splashes' | 'discovery-splashes' | 'avatar-decorations') {
    return id && /^[a-f0-9_]{1,128}$/i.test(hash) ? `https://cdn.discordapp.com/${kind}/${id}/${hash}.png?size=512` : null;
}
function memberImage(guildId: string, userId: string, hash: string, kind: 'avatars' | 'banners') {
    return /^[a-f0-9_]{1,128}$/i.test(hash) ? `https://cdn.discordapp.com/guilds/${guildId}/users/${userId}/${kind}/${hash}.${hash.startsWith('a_') ? 'gif' : 'png'}?size=256` : null;
}
function userResult(id: string, data: Data, note: string, member: Data = {}, guildId = '') {
    const decoration = object(data.avatar_decoration_data), primaryGuild = object(data.primary_guild);
    const discriminator = text(data.discriminator);
    return { kind: 'user', user: { id, username: text(data.username), displayName: text(data.global_name), nickname: text(member.nick), discriminator: discriminator === '0' ? null : discriminator, avatarUrl: memberImage(guildId, id, text(member.avatar), 'avatars') || cdnAvatar(id, text(data.avatar), 'avatars') || `https://cdn.discordapp.com/embed/avatars/${discriminator && discriminator !== '0' ? Number(discriminator) % 5 : Number(BigInt(id) >> 22n) % 6}.png`, hasCustomAvatar: Boolean(member.avatar || data.avatar), bannerUrl: memberImage(guildId, id, text(member.banner), 'banners') || cdnAvatar(id, text(data.banner), 'banners'), decorationAsset: text(decoration.asset), accentColor: number(data.accent_color), bot: data.bot === true, system: data.system === true, publicFlags: number(data.public_flags), primaryGuildTag: text(primaryGuild.tag), primaryGuildId: text(primaryGuild.identity_guild_id), created: snowflakeDate(id), guildJoinedAt: text(member.joined_at) }, note, profileUrl: `https://discord.com/users/${id}` };
}
async function lanyardUser(id: string): Promise<Data> {
    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${id}`, { signal: AbortSignal.timeout(4000), cache: 'no-store' });
        if (!response.ok) return {};
        const payload = object(await response.json());
        const user = object(object(payload.data).discord_user);
        return payload.success === true && text(user.id) === id && text(user.username) ? user : {};
    } catch { return {}; }
}
async function discord(path: string, token?: string) {
    const response = await fetch(`${api}${path}`, { signal: AbortSignal.timeout(8000), headers: { accept: 'application/json', ...(token ? { authorization: `Bot ${token}` } : {}) }, cache: 'no-store' });
    if (!response.ok) throw new DiscordApiError(response.status, response.status === 404 ? 'Discord could not find this record or make it available to this bot.' : response.status === 401 ? 'The configured Discord bot token is invalid. Check it in Admin > API & Tokens.' : response.status === 403 ? 'The Discord bot does not have access to this record.' : response.status === 429 ? 'Discord rate limit reached. Try again shortly.' : 'Discord API unavailable for this lookup.');
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
            let preview: Data = {};
            try { preview = await discord(`/guilds/${query}/preview`); } catch { /* Preview is available only for discoverable servers. */ }
            let widget: Data = {};
            try { widget = await discord(`/guilds/${query}/widget.json`); } catch { /* Widget requires the server to enable it. */ }
            if (!text(preview.id) && !text(widget.id)) throw new Error('This server has no public preview or enabled widget. Use a public invite link for its profile.');
            return NextResponse.json({ kind, server: { id: query, name: text(preview.name) || text(widget.name), description: text(preview.description), iconUrl: cdnAvatar(query, text(preview.icon), 'icons'), splashUrl: cdnAsset(query, text(preview.splash), 'splashes'), discoverySplashUrl: cdnAsset(query, text(preview.discovery_splash), 'discovery-splashes'), widgetUrl: text(widget.id) ? `https://discord.com/api/guilds/${query}/widget.png?style=banner2` : null, online: number(preview.approximate_presence_count) ?? number(widget.presence_count), members: number(preview.approximate_member_count), features: Array.isArray(preview.features) ? preview.features.filter((v): v is string => typeof v === 'string').slice(0, 30) : [], created: snowflakeDate(query), invite: text(widget.instant_invite), channels: Array.isArray(widget.channels) ? widget.channels.length : null }, note: text(preview.id) ? 'Public Discovery preview. Member counts are approximate.' : 'Only the public widget is available. It shows a server badge, not the original icon or banner.' }, { headers: { 'Cache-Control': 'no-store' } });
        }
        const { token: botToken, guildId } = await getDiscordLookupCredentials();
        if (!botToken) {
            const lanyard = await lanyardUser(query);
            if (text(lanyard.username)) return NextResponse.json(userResult(query, lanyard, 'Profile fields from Lanyard, available only for users enrolled in its Discord server. Add a bot token for official Discord lookup.'), { headers: { 'Cache-Control': 'no-store' } });
            return NextResponse.json({ kind, configurationRequired: true, user: { id: query, username: '', displayName: '', bot: null, created: snowflakeDate(query) }, note: 'Profile data and avatar require a Discord bot token or an enrolled Lanyard profile. Configure the bot in Admin > API & Tokens. The decoded creation date does not verify this account.', profileUrl: `https://discord.com/users/${query}` }, { headers: { 'Cache-Control': 'no-store' } });
        }
        try {
            const data = await discord(`/users/${query}`, botToken);
            return NextResponse.json(userResult(query, data, 'Profile fields returned by the configured Discord bot. A personal banner or server nickname may not be available.'), { headers: { 'Cache-Control': 'no-store' } });
        }
        catch (error) {
            if (!(error instanceof DiscordApiError) || error.status !== 404) throw error;
            if (/^\d{17,20}$/.test(guildId)) {
                try {
                    const member = await discord(`/guilds/${guildId}/members/${query}`, botToken);
                    const user = object(member.user);
                    if (text(user.id) === query && text(user.username)) {
                        return NextResponse.json(userResult(query, user, 'Verified through a server where the configured bot is installed. Nickname and server avatar are specific to that server.', member, guildId), { headers: { 'Cache-Control': 'no-store' } });
                    }
                } catch (memberError) {
                    if (memberError instanceof DiscordApiError && memberError.status === 401) throw memberError;
                }
            }
            const lanyard = await lanyardUser(query);
            if (text(lanyard.username)) return NextResponse.json(userResult(query, lanyard, 'Profile fields from Lanyard, available only for users enrolled in its Discord server. A banner and server nickname may be unavailable.'), { headers: { 'Cache-Control': 'no-store' } });
            return NextResponse.json({ kind, user: { id: query, username: '', displayName: '', avatarUrl: null, bannerUrl: null, bot: null, created: snowflakeDate(query) }, note: `Discord returned 404 for this User ID.${guildId ? ' The configured bot could not find this member in its server.' : ' Add a Server ID in Admin > API & Tokens to try member lookup.'} Lanyard had no matching enrolled profile. The date is decoded from the ID and does not verify an account. Check that you copied the User ID, not a server or message ID.`, profileUrl: `https://discord.com/users/${query}` }, { headers: { 'Cache-Control': 'no-store' } });
        }
    } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Discord lookup failed.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } }); }
}
