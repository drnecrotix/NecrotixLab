'use client';

import { QuantumError } from '@/components/ui/QuantumError';
import { useEffect } from 'react';
import { reportRuntimeError } from '@/lib/runtime-errors.client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => { reportRuntimeError('render', { code: error.digest || error.name }); }, [error]);
    return (
        <html>
            <body>
                <QuantumError
                    type="500"
                    reset={reset}
                />
            </body>
        </html>
    );
}
