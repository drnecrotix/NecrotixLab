import 'server-only';

import { prisma } from '@/lib/prisma';
import { resolveIntegrationValue } from '@/lib/integration-credentials';

export async function getDiscordBotToken() {
    try {
        const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' }, select: { integrationSettings: true } });
        return resolveIntegrationValue(settings?.integrationSettings, 'discord.botToken', 'DISCORD_BOT_TOKEN');
    } catch {
        return String(process.env.DISCORD_BOT_TOKEN ?? '').trim();
    }
}
