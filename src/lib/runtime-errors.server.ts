import 'server-only';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { diagnosticCode, diagnosticPath } from './runtime-errors';

let nextCleanup = 0;
export async function recordRuntimeError(event: { source: 'browser' | 'server' | 'media'; kind: string; path: string; resource?: string; status?: number; code?: string }) {
    try {
        const now = Date.now();
        const path = diagnosticPath(event.path);
        const code = diagnosticCode(event.code);
        const resource = event.resource ? diagnosticPath(event.resource) : '';
        const fingerprint = createHash('sha256').update(`${event.source}:${event.kind}:${path}:${resource}:${event.status || 0}:${code}`).digest('hex');
        const id = `runtime_${createHash('sha256').update(`${fingerprint}:${Math.floor(now / 900000)}`).digest('hex').slice(0, 40)}`;
        const title = event.source === 'media' ? 'Image processing failed' : event.source === 'server' ? 'Server request failed' : `${event.kind[0]?.toUpperCase()}${event.kind.slice(1)} failure reported by browser`;
        const severity = event.status && event.status < 500 ? 'warning' : 'error';
        await prisma.siteHealthLog.upsert({ where: { id }, create: {
            id, source: event.source, checkId: event.kind, severity, title, fingerprint,
            message: `${path}${event.status ? ` · HTTP ${event.status}` : ''} · ${code}`,
            details: { path, resource, status: event.status || 0, code, verified: event.source !== 'browser' },
        }, update: { occurrences: { increment: 1 }, lastSeenAt: new Date(now) } });
        if (now > nextCleanup) {
            nextCleanup = now + 3600000;
            await prisma.siteHealthLog.deleteMany({ where: { createdAt: { lt: new Date(now - 7 * 86400000) } } });
        }
    } catch { /* Logging must never break the request or recursively report itself. */ }
}
