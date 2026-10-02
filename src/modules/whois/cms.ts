export type CmsMatch = { name: string; confidence: 'strong' | 'possible'; evidence: string[] };
export function detectCms(html: string, headers: Record<string, string | string[] | undefined>): CmsMatch[] {
    const text = html.slice(0, 196608);
    const generator = text.match(/<meta\b[^>]*name=["']generator["'][^>]*content=["']([^"']+)/i)?.[1]
        || text.match(/<meta\b[^>]*content=["']([^"']+)["'][^>]*name=["']generator["']/i)?.[1] || '';
    const header = Object.entries(headers).map(([key, value]) => `${key}: ${value}`).join('\n');
    const rules: [string, RegExp, RegExp][] = [
        ['WordPress', /wordpress/i, /(?:src|href)=["'][^"']*\/wp-(?:content|includes)\//i],
        ['Joomla', /joomla/i, /(?:src|href)=["'][^"']*\/media\/system\/js\//i],
        ['Drupal', /drupal/i, /(?:drupalSettings|data-drupal-selector)/i],
        ['Shopify', /shopify/i, /(?:cdn\.shopify\.com|Shopify\.shop)/i],
        ['Ghost', /ghost/i, /(?:src|href)=["'][^"']*\/ghost\/api\//i],
        ['Wix', /wix/i, /(?:static\.wixstatic\.com|wix-thunderbolt)/i],
        ['Squarespace', /squarespace/i, /(?:static1\.squarespace\.com|squarespace-cdn)/i],
        ['Webflow', /webflow/i, /data-wf-(?:site|page)=/i],
        ['PrestaShop', /prestashop/i, /(?:prestashop =|prestashop\.js)/i],
    ];
    return rules.flatMap(([name, identity, asset]) => {
        const evidence = [];
        if (identity.test(generator)) evidence.push(`Generator: ${generator.slice(0, 120)}`);
        if (asset.test(text)) evidence.push('CMS-specific markup or assets');
        if (identity.test(header)) evidence.push('CMS-specific response header');
        return evidence.length ? [{ name, confidence: evidence.some(item => item.startsWith('Generator:')) || evidence.length > 1 ? 'strong' as const : 'possible' as const, evidence }] : [];
    });
}
export function adminPaths(matches: CmsMatch[]): string[] {
    const paths: Record<string, string[]> = { WordPress: ['/wp-login.php', '/wp-admin/'], Joomla: ['/administrator/'], Drupal: ['/user/login'], Ghost: ['/ghost/'], PrestaShop: ['/admin/'] };
    return [...new Set([...matches.flatMap(match => paths[match.name] || []), '/admin/', '/login/'])].slice(0, 5);
}
export function classifyAdmin(status: number, html: string, finalPath: string, homepage: string): string {
    if (status === 404 || status === 410) return 'Not found';
    if (status === 401 || status === 403) return 'Access restricted; panel unconfirmed';
    if (status < 200 || status >= 300) return 'Unconfirmed response';
    if (finalPath === '/' || html.trim() === homepage.trim()) return 'Homepage / catch-all; panel unconfirmed';
    const password = /<input\b[^>]*type\s*=\s*["']?password\b/i.test(html);
    const login = /(?:log[ -]?in|sign[ -]?in|wp-submit|user_login|administrator|username)/i.test(html);
    return password && login ? 'Login form detected; admin role unconfirmed' : 'Page exists; panel unconfirmed';
}
