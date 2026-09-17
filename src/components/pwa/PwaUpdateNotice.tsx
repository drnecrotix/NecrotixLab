'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import {
    PWA_UPDATE_CHECK_MS,
    PWA_UPDATE_DISMISS_KEY,
    PWA_VERSION_STORAGE_KEY,
    parsePwaVersionPayload,
    shouldOfferPwaUpdate,
} from '@/lib/pwa-update';
import type { PwaSettings } from '@/lib/pwa-settings';

export function PwaUpdateNotice({
    settings,
    standalone,
}: {
    settings: PwaSettings;
    standalone: boolean;
}) {
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
    const [remoteVersion, setRemoteVersion] = useState('');
    const [dismissed, setDismissed] = useState(false);
    const [applying, setApplying] = useState(false);
    const notifiedRef = useRef('');
    const enabled = standalone && settings.updatePromptEnabled;

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;

        const checkVersion = async () => {
            try {
                const response = await fetch('/api/pwa/version', { cache: 'no-store' });
                if (!response.ok) return;
                const remote = parsePwaVersionPayload(await response.json());
                if (!remote || cancelled) return;
                const known = window.localStorage.getItem(PWA_VERSION_STORAGE_KEY);
                if (!known) {
                    window.localStorage.setItem(PWA_VERSION_STORAGE_KEY, remote);
                    return;
                }
                if (!shouldOfferPwaUpdate(known, remote)) return;
                if (window.sessionStorage.getItem(PWA_UPDATE_DISMISS_KEY) === remote) {
                    setDismissed(true);
                    return;
                }
                setRemoteVersion(remote);
            } catch {
                // Offline or blocked — the waiting worker path can still fire.
            }
        };

        void checkVersion();
        const onVisible = () => {
            if (document.visibilityState === 'visible') void checkVersion();
        };
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('focus', onVisible);
        const timer = window.setInterval(() => void checkVersion(), PWA_UPDATE_CHECK_MS);
        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('focus', onVisible);
            window.clearInterval(timer);
        };
    }, [enabled]);

    useEffect(() => {
        if (!enabled || !('serviceWorker' in navigator)) return;
        let registration: ServiceWorkerRegistration | undefined;
        let cancelled = false;
        let reloading = false;

        const watch = (reg: ServiceWorkerRegistration) => {
            registration = reg;
            if (reg.waiting) setWaitingWorker(reg.waiting);
            const installing = reg.installing;
            if (installing) {
                installing.addEventListener('statechange', () => {
                    if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                        setWaitingWorker(installing);
                    }
                });
            }
        };

        const onUpdateFound = () => {
            if (registration) watch(registration);
        };

        const onControllerChange = () => {
            if (reloading) return;
            reloading = true;
            window.location.reload();
        };

        void navigator.serviceWorker.getRegistration().then((reg) => {
            if (cancelled || !reg) return;
            watch(reg);
            reg.addEventListener('updatefound', onUpdateFound);
            void reg.update();
        });
        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

        const onVisible = () => {
            if (document.visibilityState === 'visible') void registration?.update();
        };
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('focus', onVisible);
        const timer = window.setInterval(() => void registration?.update(), PWA_UPDATE_CHECK_MS);

        return () => {
            cancelled = true;
            registration?.removeEventListener('updatefound', onUpdateFound);
            navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('focus', onVisible);
            window.clearInterval(timer);
        };
    }, [enabled]);

    useEffect(() => {
        if (!enabled || dismissed) return;
        const version = remoteVersion || (waitingWorker ? 'waiting' : '');
        if (!version || notifiedRef.current === version) return;
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        notifiedRef.current = version;
        try {
            new Notification(`${settings.shortName} update`, {
                body: 'A newer version is ready. Open the app to update.',
                tag: 'pwa-update',
            });
        } catch {
            // Notification constructor can throw in some installed webviews.
        }
    }, [enabled, dismissed, remoteVersion, waitingWorker, settings.shortName]);

    const applyUpdate = useCallback(() => {
        setApplying(true);
        if (remoteVersion) window.localStorage.setItem(PWA_VERSION_STORAGE_KEY, remoteVersion);
        window.sessionStorage.removeItem(PWA_UPDATE_DISMISS_KEY);
        if (waitingWorker) {
            waitingWorker.postMessage('SKIP_WAITING');
            window.setTimeout(() => window.location.reload(), 600);
            return;
        }
        window.location.reload();
    }, [remoteVersion, waitingWorker]);

    const dismiss = useCallback(() => {
        const token = remoteVersion || 'waiting';
        window.sessionStorage.setItem(PWA_UPDATE_DISMISS_KEY, token);
        setDismissed(true);
    }, [remoteVersion]);

    if (!enabled || dismissed || applying) {
        if (!enabled || dismissed) return null;
        return (
            <div className="fixed inset-x-3 bottom-24 z-[141] rounded-2xl border border-white/10 bg-black/85 p-3 text-white shadow-2xl backdrop-blur-xl sm:left-auto sm:right-4 sm:w-[360px]">
                <div className="flex items-center gap-2 text-xs font-semibold">
                    <RefreshCw className="size-3.5 animate-spin" />
                    Updating {settings.shortName}…
                </div>
            </div>
        );
    }

    if (!waitingWorker && !remoteVersion) return null;

    return (
        <div
            role="alertdialog"
            aria-label="App update available"
            className="fixed inset-x-3 bottom-24 z-[141] rounded-2xl border border-white/10 bg-black/85 p-3 text-white shadow-2xl backdrop-blur-xl sm:left-auto sm:right-4 sm:w-[360px]"
        >
            <div className="flex items-start gap-2">
                <RefreshCw className="mt-0.5 size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">Update available</p>
                    <p className="mt-1 text-[11px] leading-5 text-white/55">
                        A newer version of {settings.shortName} is ready. Update now to load the latest changes.
                    </p>
                </div>
                <button type="button" onClick={dismiss} className="grid size-8 shrink-0 place-items-center rounded-full text-white/55" aria-label="Later">
                    <X className="size-3.5" />
                </button>
            </div>
            <button
                type="button"
                onClick={applyUpdate}
                className="mt-3 h-11 w-full rounded-xl bg-white px-3 text-[11px] font-semibold text-black"
            >
                Update
            </button>
        </div>
    );
}
