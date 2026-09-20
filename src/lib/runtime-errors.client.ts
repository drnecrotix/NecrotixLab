'use client';
import { diagnosticCode, diagnosticPath, type RuntimeErrorKind } from './runtime-errors';

let sent = 0;
let windowStart = 0;
const recent = new Set<string>();
export function reportRuntimeError(kind: RuntimeErrorKind, options: { resource?: string; status?: number; code?: string } = {}) {
    if (typeof window === 'undefined' || location.pathname.startsWith('/admin') || navigator.doNotTrack === '1') return;
    if (Date.now() - windowStart > 60000) { sent = 0; recent.clear(); windowStart = Date.now(); }
    const data = { kind, path: diagnosticPath(location.pathname), resource: options.resource ? diagnosticPath(options.resource) : '', status: options.status, code: diagnosticCode(options.code) };
    const key = JSON.stringify(data);
    if (sent >= 10 || recent.has(key)) return;
    sent++; recent.add(key);
    void fetch('/api/runtime-errors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: key, keepalive: true }).catch(() => {});
}
