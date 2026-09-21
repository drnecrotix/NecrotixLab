'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
    const pathname = usePathname();
    const onBlog = pathname === '/blog' || pathname.startsWith('/blog/');
    const onWiki = pathname === '/wiki' || pathname.startsWith('/wiki/');
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const footer = document.querySelector<HTMLElement>('[data-site-footer]');
        if (!footer) return;
        const observer = new IntersectionObserver(([entry]) => setIsVisible(Boolean(entry?.isIntersecting)), {
            threshold: 0.08,
        });
        observer.observe(footer);
        return () => observer.disconnect();
    }, [pathname]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (onBlog || onWiki) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <div
                    data-back-to-top=""
                    className="pointer-events-none fixed bottom-5 right-5 z-[100] flex items-center justify-center hide-on-modal sm:bottom-8 sm:right-8"
                >
                    <motion.button
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ duration: 0.22 }}
                        onClick={scrollToTop}
                        aria-label="Return to page start"
                        className="group pointer-events-auto inline-flex min-h-12 items-center gap-2 rounded-full border border-foreground/15 bg-background/90 px-4 text-xs font-bold text-foreground shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-foreground/35"
                    >
                        <span className="hidden sm:inline">Page start</span>
                        <span className="grid size-7 place-items-center rounded-full bg-foreground text-background"><ArrowUp className="size-4 transition-transform group-hover:-translate-y-0.5" /></span>
                    </motion.button>
                </div>
            )}
        </AnimatePresence>
    );
}
