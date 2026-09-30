import { UrlScamCheck } from '@addons/Tools/components/UrlScamCheck';
import { ToolShell } from '@addons/Tools/components/ToolShell';
export default function Page() { return <ToolShell eyebrow="Web & security" title="URL Scam Check" description="Identify the real destination and inspect suspicious URL structure before opening a link." processing="Local browser analysis; no destination request"><UrlScamCheck /></ToolShell>; }
