'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LoadingScreen } from '@/components/layout';
import { HeroVisual } from '@/components/sections/HeroVisual';
import { HomeBlogSection } from '@/components/home/HomeBlogSection';
import { HomeProjectsSection } from '@/components/home/HomeProjectsSection';
import { HomeCapabilitiesSection, HomeServicesAndLabSection } from '@/components/home/HomeEditorialSections';
import { HomeEngineeringSection } from '@/components/home/HomeEngineeringSection';
import { usePreloadState } from '@/components/ui/arc-preloader-hero';
import type { HomepageContent } from '@/lib/homepage-content';
import type { PublicIdentity } from '@/lib/public-identity';
import type { PublicPost } from '@/lib/cms-posts';
import type { Project } from '@/types';

function readPortfolioLoaded() {
    try {
        return window.sessionStorage.getItem('portfolioLoaded');
    } catch {
        return null;
    }
}

function writePortfolioLoaded() {
    try {
        window.sessionStorage.setItem('portfolioLoaded', 'true');
    } catch {
        // Some embedded browsers can restrict sessionStorage. The loader should
        // still complete normally even when persistence is unavailable.
    }
}

type Props = {
    content: HomepageContent;
    identity: PublicIdentity;
    posts: PublicPost[];
    projects: Project[];
};

export default function HomeClient({ content, identity, posts, projects }: Props) {
    const { phase } = usePreloadState();
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialLoadingExit, setIsInitialLoadingExit] = useState(false);
    const [skipAnimation, setSkipAnimation] = useState(false);
    const autoScrollInProgress = useRef(false);

    useEffect(() => {
        const hasLoaded = readPortfolioLoaded();
        const frame = window.requestAnimationFrame(() => {
            if (hasLoaded) {
                setSkipAnimation(true);
                setIsLoading(false);
            }
        });
        return () => window.cancelAnimationFrame(frame);
    }, []);


    const isReadyToAnimate = isLoading ? isInitialLoadingExit : phase === 'reveal' || phase === 'done';
    const showBlog = content.showBlogPosts && posts.length > 0;
    const showProjects = content.showProjects && projects.length > 0;
    const bothSectionsVisible = showBlog && showProjects;
    const projectsFirst = false;
    const loaderDuration = 2000;

    const handleLoadingComplete = () => {
        setIsLoading(false);
        window.scrollTo({ top: 0, behavior: 'instant' });
        writePortfolioLoaded();
    };


    useEffect(() => {
        if (isLoading || !bothSectionsVisible) return;

        const desktopPointer = window.matchMedia('(min-width: 1024px) and (pointer: fine)');
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let unlockTimer: number | null = null;

        const smoothTo = (section: HTMLElement, block: ScrollLogicalPosition) => {
            if (autoScrollInProgress.current) return;
            autoScrollInProgress.current = true;
            section.scrollIntoView({ behavior: 'smooth', block });
            if (unlockTimer !== null) window.clearTimeout(unlockTimer);
            unlockTimer = window.setTimeout(() => { autoScrollInProgress.current = false; }, 680);
        };

        const handleWheel = (event: WheelEvent) => {
            if (
                !desktopPointer.matches
                || reducedMotion.matches
                || event.defaultPrevented
                || event.ctrlKey
                || autoScrollInProgress.current
                || Math.abs(event.deltaY) < 18
            ) return;

            const firstSection = document.getElementById(projectsFirst ? 'home-projects' : 'home-blog');
            const secondSection = document.getElementById(projectsFirst ? 'home-blog' : 'home-projects');
            if (!firstSection || !secondSection) return;

            const firstRect = firstSection.getBoundingClientRect();
            const secondRect = secondSection.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            if (
                event.deltaY > 0
                && secondRect.top > viewportHeight * 0.14
                && secondRect.top < viewportHeight * 0.72
                && firstRect.bottom < viewportHeight * 0.82
            ) {
                event.preventDefault();
                smoothTo(secondSection, 'start');
                return;
            }

            if (
                event.deltaY < 0
                && firstRect.bottom > viewportHeight * 0.28
                && firstRect.bottom < viewportHeight * 0.86
                && secondRect.top > viewportHeight * 0.18
            ) {
                event.preventDefault();
                smoothTo(firstSection, 'end');
            }
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            if (unlockTimer !== null) window.clearTimeout(unlockTimer);
            autoScrollInProgress.current = false;
            window.removeEventListener('wheel', handleWheel);
        };
    }, [isLoading, bothSectionsVisible, projectsFirst]);

    const journalSection = showBlog ? <HomeBlogSection posts={posts} /> : null;
    const projectsSection = showProjects ? <HomeProjectsSection projects={projects} /> : null;

    return (
        <>
            {isLoading && <LoadingScreen onComplete={handleLoadingComplete} onExitStart={() => setIsInitialLoadingExit(true)} duration={loaderDuration} />}
            <motion.main
                id="home-hero"
                initial={skipAnimation ? false : { opacity: 0, y: 40 }}
                animate={skipAnimation ? { opacity: 1, y: 0 } : isReadyToAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ duration: skipAnimation ? 0 : 1.4, ease: skipAnimation ? 'linear' : [0.16, 1, 0.3, 1], opacity: { duration: skipAnimation ? 0 : 0.8 } }}
                className="home-hero-container relative flex h-[100svh] min-h-[100svh] flex-none overflow-hidden will-change-transform will-change-opacity [&>div]:!h-[100svh] [&>div]:!min-h-[100svh]"
            >
                <HeroVisual
                    isExiting={isReadyToAnimate}
                    content={content}
                    identity={identity}
                />
            </motion.main>
            <HomeCapabilitiesSection discordUrl={identity.discordUrl} />
            <HomeEngineeringSection />
            {projectsFirst ? <>{projectsSection}{journalSection}</> : <>{journalSection}{projectsSection}</>}
            <HomeServicesAndLabSection projects={projects} />
        </>
    );
}
