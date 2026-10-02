'use client';
import { useEffect, useState } from 'react';
type Connectivity = { family: string; status: string; ip?: string; durationMs: number };
type Ports = { ip: string; checkedAt: string; vantage: string; results: { port: number; status: string; durationMs: number }[] };
export function WhoisDiagnostics() {
    const [device, setDevice] = useState({ type: 'Detecting...', platform: '', browser: '', screen: '' });
    useEffect(() => {
        const ua = navigator.userAgent;
        const tablet = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
        const type = tablet ? 'Tablet' : /Mobi|iPhone|iPod/i.test(ua) ? 'Phone' : 'Desktop / laptop';
        const platform = /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) || tablet && /Macintosh/.test(ua) ? 'iOS / iPadOS' : /Windows/.test(ua) ? 'Windows' : /Macintosh/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Unknown';
        const browser = /Edg|EdgiOS|EdgA/.test(ua) ? 'Edge' : /OPR|Opera/.test(ua) ? 'Opera' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /Chrome|CriOS/.test(ua) ? 'Chrome / Chromium' : /Safari/.test(ua) ? 'Safari' : 'Unknown';
        setDevice({ type, platform, browser, screen: `${window.screen.width} × ${window.screen.height} CSS pixels` });
    }, []);
    const [connections, setConnections] = useState<Connectivity[]>([]), [testing, setTesting] = useState(false);
    const [ip, setIp] = useState(''), [authorized, setAuthorized] = useState(false), [ports, setPorts] = useState<Ports | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
    async function testConnection() {
        setTesting(true); setConnections([]);
        const results = await Promise.all([['IPv4', 'api.ipify.org'], ['IPv6', 'api6.ipify.org'], ['Automatic / dual stack', 'api64.ipify.org']].map(async ([family, host]) => {
            const started = performance.now();
            try {
                const response = await fetch(`https://${host}?format=json`, { cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(7000) });
                if (!response.ok) throw new Error();
                const data = await response.json();
                if (typeof data.ip !== 'string' || data.ip.length > 45 || (family === 'IPv6' && !data.ip.includes(':')) || (family === 'IPv4' && !/^\d+\.\d+\.\d+\.\d+$/.test(data.ip))) throw new Error();
                return { family, status: 'Reachable', ip: data.ip, durationMs: Math.round(performance.now() - started) };
            } catch { return { family, status: 'Could not verify', durationMs: Math.round(performance.now() - started) }; }
        }));
        setConnections(results); setTesting(false);
    }
    async function checkPorts(event: React.FormEvent) {
        event.preventDefault(); setBusy(true); setError(''); setPorts(null);
        try {
            const response = await fetch('/api/tools/whois/ports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ip, authorized }), signal: AbortSignal.timeout(12000) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Port check failed');
            setPorts(data);
        } catch (e) { setError(e instanceof Error ? e.message : 'Port check failed'); } finally { setBusy(false); }
    }
    return <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border p-5"><h3 className="font-bold">Your device & IPv4 / IPv6 connectivity</h3><dl className="mt-3 grid grid-cols-2 gap-2 text-sm"><dt className="text-muted-foreground">Device type</dt><dd>{device.type}</dd><dt className="text-muted-foreground">Operating system</dt><dd>{device.platform || 'No data'}</dd><dt className="text-muted-foreground">Browser</dt><dd>{device.browser || 'No data'}</dd><dt className="text-muted-foreground">Screen</dt><dd>{device.screen || 'No data'}</dd></dl><p className="mt-2 text-xs text-muted-foreground">Estimated from this browser only; desktop mode and privacy settings may change the result. An IP lookup cannot identify a remote device type or model. Device details stay in your browser.</p><p className="my-3 text-sm text-muted-foreground">Run from your browser, independently of the lookup target. Sends requests to ipify, which receives your public IP. VPNs, privacy tools and endpoint failures can affect results. Duration measures HTTPS request time, not ping.</p><button type="button" disabled={testing} onClick={testConnection} className="rounded-xl border border-border px-4 py-3 disabled:opacity-50">{testing ? 'Testing...' : 'Test my connection'}</button><div aria-live="polite" className="mt-4 space-y-3">{connections.map(item => <div key={item.family} className="rounded-xl bg-muted/40 p-3"><p className="font-semibold">{item.family}: {item.status}</p><p className="break-all text-sm">{item.ip || 'No address verified'} · {item.durationMs} ms</p></div>)}</div><p className="mt-3 text-xs text-muted-foreground">An IPv6 failure does not establish hacking or interception. Automatic mode may use IPv4 even when IPv6 works.</p></section>
        <section className="rounded-2xl border border-border p-5"><h3 className="font-bold">Public TCP ports</h3><p className="my-3 text-sm text-muted-foreground">Owner/Admin only. Checks 12 common ports on one public IP from the hosting server. Enter an address you own or are authorized to test. A mobile public IP may belong to a shared carrier gateway.</p><form onSubmit={checkPorts} className="space-y-3"><input required maxLength={45} aria-label="Public IP for port check" placeholder="Public IPv4 or IPv6" value={ip} onChange={e => { setIp(e.target.value); setPorts(null); }} className="min-h-11 w-full rounded-xl border border-border bg-background px-3" /><label className="flex items-start gap-2 text-sm"><input type="checkbox" required checked={authorized} onChange={e => setAuthorized(e.target.checked)} />I own this target or have permission to test it.</label><button disabled={busy || !authorized} className="rounded-xl border border-border px-4 py-3 disabled:opacity-50">{busy ? 'Checking...' : 'Check TCP ports'}</button></form>{error && <p role="alert" className="mt-3 text-sm text-rose-500">{error}</p>}{ports && <div aria-live="polite" className="mt-4"><p className="break-all text-xs text-muted-foreground">{ports.ip} · {ports.checkedAt}<br />{ports.vantage}</p><div className="mt-3 grid grid-cols-2 gap-2">{ports.results.map(item => <div key={item.port} className="rounded-lg bg-muted/40 p-2 text-sm">TCP {item.port}: <strong>{item.status}</strong><span className="block text-xs">{item.durationMs} ms</span></div>)}</div></div>}<p className="mt-3 text-xs text-muted-foreground">Open means a TCP connection succeeded, not a vulnerability. Closed means refused. Timeout and unreachable are inconclusive; firewalls or hosting egress restrictions may be responsible. UDP and internal LAN ports are not tested.</p></section>
    </div>;
}
