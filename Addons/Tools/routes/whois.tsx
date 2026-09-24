import { WhoisLookup } from '@addons/Tools/components/WhoisLookup';
import { ToolShell } from '@addons/Tools/components/ToolShell';
export default function Page() { return <ToolShell eyebrow="Network tools" title="WHOIS / IP Lookup" description="Inspect public RDAP registration and IP allocation data, plus current domain DNS records." processing="Query sent to registry RDAP servers; DNS resolved on our server"><WhoisLookup /></ToolShell>; }
