import 'server-only';

import { prisma } from '@/lib/prisma';
import { resolveIntegrationValue } from '@/lib/integration-credentials';

export async function getDiscordLookupCredentials() {
    try {
        const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' }, select: { integrationSettings: true } });
        return {
            token: resolveIntegrationValue(settings?.integrationSettings, 'discord.botToken', 'DISCORD_BOT_TOKEN'),
            guildId: resolveIntegrationValue(settings?.integrationSettings, 'discord.guildId', 'DISCORD_GUILD_ID'),
        };
    } catch {
        return { token: String(process.env.DISCORD_BOT_TOKEN ?? '').trim(), guildId: String(process.env.DISCORD_GUILD_ID ?? '').trim() };
    }
}
