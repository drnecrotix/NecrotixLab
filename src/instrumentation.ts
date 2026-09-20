import type { Instrumentation } from 'next';

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
    if (process.env.NEXT_RUNTIME !== 'nodejs' || request.path.startsWith('/api/runtime-errors')) return;
    const { recordRuntimeError } = await import('@/lib/runtime-errors.server');
    const failure = error instanceof Error ? error as Error & { digest?: string } : null;
    await recordRuntimeError({ source: 'server', kind: context.routeType, path: context.routePath, status: 500, code: failure?.digest || failure?.name || 'ServerError' });
};
