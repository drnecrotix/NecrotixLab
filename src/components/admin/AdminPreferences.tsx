'use client';
import { useEffect, useState } from 'react';

export function AdminPreferences() {
    const [density, setDensity] = useState('comfortable');
    const [refresh, setRefresh] = useState('30');
    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            try { setDensity(localStorage.getItem('necrotix-admin-density') || 'comfortable'); setRefresh(localStorage.getItem('necrotix-admin-refresh') || '30'); } catch { /* defaults */ }
        });
        return () => cancelAnimationFrame(frame);
    }, []);
    function save(key: string, value: string) {
        try { localStorage.setItem(key, value); window.dispatchEvent(new Event('necrotix-admin-preferences')); } catch { /* Nonpersistent preferences still work in this view. */ }
    }
    return <section className="rounded-xl border border-foreground/10 bg-foreground/[0.025] p-4"><div className="mb-4"><h3 className="text-sm font-semibold">Workspace preferences</h3><p className="mt-1 text-xs text-muted-foreground">Saved in this browser. These options do not change the public website.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-muted-foreground">Layout density<select value={density} onChange={(e) => { setDensity(e.target.value); save('necrotix-admin-density',e.target.value); }} className="mt-2 block min-h-10 w-full rounded-lg border border-foreground/15 bg-background px-3 text-sm text-foreground"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label><label className="text-xs text-muted-foreground">Traffic auto-refresh<select value={refresh} onChange={(e) => { setRefresh(e.target.value); save('necrotix-admin-refresh',e.target.value); }} className="mt-2 block min-h-10 w-full rounded-lg border border-foreground/15 bg-background px-3 text-sm text-foreground"><option value="0">Manual only</option><option value="30">Every 30 seconds</option><option value="60">Every minute</option></select></label></div></section>;
}
