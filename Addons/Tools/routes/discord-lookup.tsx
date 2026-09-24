import type { Metadata } from 'next';
import { DiscordLookup } from '@addons/Tools/components/DiscordLookup';
import { ToolShell } from '@addons/Tools/components/ToolShell';
import { notFound } from 'next/navigation';
import { addonEnabled } from '@/lib/addons.server';
export const metadata: Metadata = { title: 'Discord Lookup', description: 'Inspect public Discord invite and server widget information or an authorized bot-visible user profile.' };
export default async function Page() { if (!(await addonEnabled('discord-lookup'))) notFound(); return <ToolShell eyebrow="Community tools" title="Discord Lookup" description="Check a public server invite, a server ID with an enabled widget, or a user ID when the site bot is configured."><DiscordLookup /></ToolShell>; }
