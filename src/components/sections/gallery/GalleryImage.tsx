'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { galleryImageUrl } from '@/lib/gallery-image';
import { reportRuntimeError } from '@/lib/runtime-errors.client';

// Managed images are already processed and watermarked by our media endpoint.
// Avoid a second, internal HTTP request through Next's image optimizer.
export function GalleryImage({ retryable = true, ...props }: ImageProps & { retryable?: boolean }) {
    const [attempt, setAttempt] = useState(0);
    const [failed, setFailed] = useState(false);
    const src = typeof props.src === 'string' ? props.src : '';
    const managed = src.startsWith('/api/protected-media/');
    return <>
        <Image {...props} alt={props.alt} key={`${src}:${attempt}`} loader={managed ? ({ src: source, width }) => {
            const url = galleryImageUrl(source, width);
            return attempt ? `${url}&retry=${attempt}` : url;
        } : undefined} unoptimized={!managed && /^https?:/.test(src)} onError={(event) => {
            setFailed(true);
            reportRuntimeError('resource', { resource: src, code: 'GalleryImageError' });
            props.onError?.(event);
        }} onLoad={(event) => {
            setFailed(false);
            props.onLoad?.(event);
        }} />
        {failed ? <div role="status" className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/95 p-4 text-center text-foreground">
            <p className="text-xs">This image could not load.</p>
            {retryable ? <button type="button" className="rounded-lg border border-foreground/20 px-3 py-2 text-xs" onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setFailed(false);
                setAttempt((value) => value + 1);
            }}>Retry image</button> : <span className="text-xs text-muted-foreground">Open image to retry</span>}
        </div> : null}
    </>;
}
