'use client';
import { QuantumError } from '@/components/ui/QuantumError';
import { useEffect } from 'react';
import { reportRuntimeError } from '@/lib/runtime-errors.client';

export default function NotFound() {
    useEffect(() => { reportRuntimeError('request', { status: 404, code: 'PageNotFound' }); }, []);
    return <QuantumError type="404" />;
}
