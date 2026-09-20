'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowUpRight, Activity, ShieldCheck } from 'lucide-react';
import type { AdminNavGroup } from './AdminMobileNavigation';

export function AdminWorkspaceHeader({ groups }: { groups: readonly AdminNavGroup[] }) {
    const path = usePathname();
    const group = groups.find(([, items]) => items.some(([, href]) => path === href || path.startsWith(`${href}/`)));
    const page = group?.[1].filter(([, href]) => path === href || path.startsWith(`${href}/`)).sort((a,b) => b[1].length - a[1].length)[0]?.[0] || 'Dashboard';
    useEffect(() => {
        const apply = () => {
            try {
                const shell = document.querySelector<HTMLElement>('.admin-shell');
                if (shell) shell.dataset.density = localStorage.getItem('necrotix-admin-density') === 'compact' ? 'compact' : 'comfortable';
            } catch { /* Private browsing still uses the default density. */ }
        };
        apply(); window.addEventListener('necrotix-admin-preferences', apply);
        return () => window.removeEventListener('necrotix-admin-preferences', apply);
    }, []);
    const allowed = new Set(groups.flatMap(([, items]) => items.map(([, href]) => href)));
    return <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-foreground/10 pb-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground"><Link href="/admin" className="font-semibold text-foreground">NecrotixLab</Link><span>/</span>{group ? <><span>{group[0]}</span><span>/</span></> : null}<span aria-current="page">{page}</span></nav>
        <div className="flex items-center gap-2">{allowed.has('/admin/site-health') ? <Link href="/admin/site-health" className="admin-quick-link"><Activity className="size-3.5" />Health</Link> : null}{allowed.has('/admin/security') ? <Link href="/admin/security" className="admin-quick-link"><ShieldCheck className="size-3.5" />Security</Link> : null}<Link href="/" target="_blank" className="admin-quick-link">View site<ArrowUpRight className="size-3.5" /></Link></div>
    </div>;
}
