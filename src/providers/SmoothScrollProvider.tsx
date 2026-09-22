'use client';

import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { ReactLenis, useLenis } from 'lenis/react';

function RouteScrollReset() {
    const pathname = usePathname();
    const lenis = useLenis();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let secondFrame = 0;
        const resetScroll = () => {
            lenis?.scrollTo(0, { immediate: true, force: true });
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        };

        // Reset immediately, then again after the new route has committed.
        // Lenis can otherwise retain the previous page's virtual scroll position.
        resetScroll();
        const firstFrame = window.requestAnimationFrame(() => {
            resetScroll();
            secondFrame = window.requestAnimationFrame(resetScroll);
        });

        return () => {
            window.cancelAnimationFrame(firstFrame);
            if (secondFrame) window.cancelAnimationFrame(secondFrame);
        };
    }, [pathname, lenis]);

    return null;
}

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isHomepage = pathname === '/';
    const options = useMemo(() => isHomepage ? {
        duration: 1.2,
        easing: (time: number) => Math.min(1, 1.001 - Math.pow(2, -10 * time)),
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.15,
        syncTouch: false,
        anchors: true,
    } : {
        lerp: 0.1,
        duration: 1.5,
        smoothWheel: true,
        smoothTouch: false,
    }, [isHomepage]);

    return (
        <ReactLenis key={isHomepage ? 'homepage' : 'default'} root options={options}>
            <RouteScrollReset />
            {children}
        </ReactLenis>
    );
}
