import { parse } from 'tldts';
export function analyzeUrl(input: string) {
    const raw = input.trim();
    if (!raw || raw.length > 4096) throw new Error('Enter a URL up to 4096 characters.');
    let url: URL;
    try { url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`); } catch { throw new Error('Enter a valid HTTP or HTTPS URL.'); }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.');
    const domain = parse(url.hostname, { allowPrivateDomains: true });
    const findings: { title: string; detail: string; severity: 'warning' | 'high' }[] = [];
    const add = (title: string, detail: string, severity: 'warning' | 'high' = 'warning') => findings.push({ title, detail, severity });
    if (url.protocol === 'http:') add('Unencrypted connection', 'HTTP does not protect the connection. HTTPS alone also does not prove trustworthiness.');
    if (url.username || url.password) add('Embedded credentials', `Text before @ can disguise the destination. The actual host is ${url.hostname}.`, 'high');
    if (domain.isIp) add('IP address destination', 'An IP address replaces the usual domain name. This can be legitimate, but makes ownership harder to identify.');
    if (!domain.domain && !domain.isIp) add('Unrecognised public domain', 'This may be a local hostname or an unrecognised suffix.');
    if (url.hostname.split('.').some(label => label.startsWith('xn--'))) add('Internationalised domain', 'Punycode can represent legitimate international names or visually similar impersonation domains. Compare the exact hostname.');
    if ((domain.subdomain?.split('.').length ?? 0) >= 3) add('Deep subdomain nesting', `The registered destination is ${domain.domain}, regardless of names appearing before it.`);
    if (['bit.ly', 'tinyurl.com', 't.co', 'shorturl.at', 'is.gd', 'ow.ly', 'buff.ly'].includes(url.hostname)) add('Shortened URL', 'The final destination is hidden. Redirects are not followed by this local check.');
    if (url.port) add('Nonstandard port', `The destination requests port ${url.port}.`);
    if (/%(?:00|0a|0d)/i.test(raw)) add('Encoded control characters', 'The URL contains encoded control characters.', 'high');
    const brands = ['paypal', 'google', 'microsoft', 'apple', 'amazon', 'facebook', 'instagram', 'discord', 'steam'];
    const brand = brands.find(name => domain.subdomain?.split(/[.-]/).includes(name) && domain.domainWithoutSuffix !== name);
    if (brand) add('Brand name in subdomain', `${brand} appears before the actual registered domain ${domain.domain}. Verify ownership independently.`, 'high');
    const redirects = [...url.searchParams].filter(([key, value]) => /^(url|redirect|redirect_uri|next|return|continue|target)$/i.test(key) && /^https?:\/\//i.test(value)).map(([key, value]) => ({ key, destination: (() => { try { return new URL(value).hostname; } catch { return 'Malformed destination'; } })() }));
    if (redirects.length) add('External redirect parameter', 'A parameter contains another website address. This is a clue, not proof of a redirect or scam.');
    return { hostname: url.hostname, domain: domain.domain, subdomain: domain.subdomain, suffix: domain.publicSuffix, protocol: url.protocol, port: url.port || 'Default', path: url.pathname, parameterCount: [...url.searchParams].length, findings, redirects, verdict: findings.some(f => f.severity === 'high') ? 'Strong warning signs' : findings.length ? 'Review recommended' : 'No URL warning signs found' };
}
