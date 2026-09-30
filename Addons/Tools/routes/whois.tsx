import { WhoisLookup } from '@addons/Tools/components/WhoisLookup';
import { ToolShell } from '@addons/Tools/components/ToolShell';
export default function Page() { return <ToolShell eyebrow="Network tools" title="WHOIS / IP Lookup" description="Inspect public RDAP registration and IP allocation data, plus DNS, network provider and approximate IP location." processing="Query sent to registry RDAP servers; DNS resolved on our server; queried IP sent to ipwho.is; map tiles from OpenStreetMap"><WhoisLookup /></ToolShell>; }
