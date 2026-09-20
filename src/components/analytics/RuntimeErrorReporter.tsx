'use client';
import { useEffect } from 'react';
import { reportRuntimeError } from '@/lib/runtime-errors.client';

export function RuntimeErrorReporter() {
    useEffect(() => {
        const onError = (event: Event) => {
            if (event instanceof ErrorEvent) {
                reportRuntimeError('javascript', { code: event.error instanceof Error ? event.error.name : 'ScriptError' });
            } else if (event.target instanceof HTMLImageElement || event.target instanceof HTMLScriptElement) {
                reportRuntimeError('resource', { resource: event.target.src, code: 'ResourceLoadError' });
            }
        };
        const onPromise = (event: PromiseRejectionEvent) => reportRuntimeError('promise', { code: event.reason instanceof Error ? event.reason.name : 'UnhandledRejection' });
        const originalFetch = window.fetch;
        const trackedFetch: typeof fetch = async (input, init) => {
            const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
            let url: URL;
            try { url = new URL(raw, location.origin); } catch { return originalFetch(input, init); }
            const track = url.origin === location.origin && !url.pathname.startsWith('/api/runtime-errors') && !url.pathname.startsWith('/api/admin');
            try {
                const response = await originalFetch(input, init);
                if (track && response.status >= 400) reportRuntimeError('request', { resource: url.pathname, status: response.status, code: 'HttpError' });
                return response;
            } catch (reason) {
                if (track && !(reason instanceof Error && reason.name === 'AbortError')) reportRuntimeError('request', { resource: url.pathname, code: 'NetworkError' });
                throw reason;
            }
        };
        window.fetch = trackedFetch;
        window.addEventListener('error', onError, true);
        window.addEventListener('unhandledrejection', onPromise);
        return () => {
            window.removeEventListener('error', onError, true);
            window.removeEventListener('unhandledrejection', onPromise);
            if (window.fetch === trackedFetch) window.fetch = originalFetch;
        };
    }, []);
    return null;
}
