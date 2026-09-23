import type { Metadata } from 'next';
import { DiscordLookup } from '@/components/tools/DiscordLookup';
import { ToolShell } from '@/components/tools/ToolShell';
export const metadata: Metadata = { title: 'Discord Lookup', description: 'Inspect public Discord invite and server widget information or an authorized bot-visible user profile.' };
export default function Page() { return <ToolShell eyebrow="Community tools" title="Discord Lookup" description="Check a public server invite, a server ID with an enabled widget, or a user ID when the site bot is configured."><DiscordLookup /></ToolShell>; }
