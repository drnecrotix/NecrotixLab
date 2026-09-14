'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { AdminNavGroup, AdminNavItem } from './AdminMobileNavigation';

export function AdminNavigationSearch({ navGroups, dashboardItem, onNavigate }: {
    navGroups: readonly AdminNavGroup[];
    dashboardItem: AdminNavItem;
    onNavigate?: () => void;
}) {
    const [query, setQuery] = useState('');
    const term = query.trim().toLowerCase();
    const items = [dashboardItem, ...navGroups.flatMap(([, links]) => links)];
    const matches = term ? items.filter(([label]) => label.toLowerCase().includes(term)) : [];

    return <div className="my-3 min-w-0">
        <label className="block text-sm text-muted-foreground">
            <span className="sr-only">Find an admin page</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a page…" className="min-h-11 w-full min-w-0 rounded-lg border border-foreground/20 bg-background px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500" />
        </label>
        {term && <div className="mt-2 rounded-lg border border-foreground/15 bg-background p-1">
            <p role="status" className="px-2 py-2 text-xs text-muted-foreground">{matches.length ? `${matches.length} pages found` : 'No matching pages'}</p>
            {matches.map(([label, href]) => <Link key={href} href={href} onClick={() => { setQuery(''); onNavigate?.(); }} className="flex min-h-11 items-center rounded-md px-2 py-2 text-sm hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">{label}</Link>)}
        </div>}
    </div>;
}
