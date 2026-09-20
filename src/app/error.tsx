'use client';

import { useEffect } from 'react';
import { QuantumError } from '@/components/ui/QuantumError';
import { reportRuntimeError } from '@/lib/runtime-errors.client';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
        reportRuntimeError('render', { code: error.digest || error.name });
    }, [error]);

    return (
        <QuantumError
            type="500"
            reset={reset}
        />
    );
}
