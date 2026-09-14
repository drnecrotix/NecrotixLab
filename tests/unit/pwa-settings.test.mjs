import assert from 'node:assert/strict';
import test from 'node:test';

import {
    defaultPwaSettings,
    enabledPwaTabs,
    normalizePwaSettings,
    pwaSettingsToManifest,
} from '../../src/lib/pwa-settings.ts';

test('empty config keeps the live site PWA defaults', () => {
    const settings = normalizePwaSettings(null);
    assert.equal(settings.name, 'NecrotixLab');
    assert.equal(settings.startUrl, '/blog');
    assert.equal(settings.display, 'standalone');
    assert.equal(settings.themeColor, '#0c0a12');
    assert.equal(settings.showInstallPrompt, false);
    assert.equal(settings.nativeChrome, true);
    assert.equal(settings.serviceWorkerEnabled, false);
    assert.equal(settings.offlineFallbackEnabled, false);
    assert.equal(settings.handleLinks, 'preferred');
});

test('unknown values and javascript urls are rejected', () => {
    const settings = normalizePwaSettings({
        display: 'window-controls-overlay',
        startUrl: 'javascript:alert(1)',
        iconUrl: 'http://insecure.example/icon.png',
        themeColor: 'red',
        handleLinks: 'always',
        launchHandler: 'popup',
        categories: ['malware', 'portfolio'],
        tabs: [{ id: 'x', label: 'Lab', href: '/lab', icon: 'not-an-icon', enabled: true }],
    });

    assert.equal(settings.display, 'standalone');
    assert.equal(settings.startUrl, '/blog');
    assert.equal(settings.iconUrl, '/favicon.svg');
    assert.equal(settings.themeColor, '#0c0a12');
    assert.equal(settings.handleLinks, 'preferred');
    assert.equal(settings.launchHandler, 'navigate-existing');
    assert.deepEqual(settings.categories, ['portfolio']);
    assert.equal(settings.tabs[0].icon, 'home');
    assert.equal(settings.tabs[0].href, '/lab');
});

test('manifest output matches the current public identity by default', () => {
    const manifest = pwaSettingsToManifest(defaultPwaSettings);
    assert.equal(manifest.name, 'NecrotixLab');
    assert.equal(manifest.short_name, 'NecrotixLab');
    assert.equal(manifest.start_url, '/blog');
    assert.equal(manifest.display, 'standalone');
    assert.equal(manifest.theme_color, '#0c0a12');
    assert.equal(manifest.handle_links, 'preferred');
    assert.equal(manifest.launch_handler.client_mode, 'navigate-existing');
    assert.ok(manifest.icons.some((icon) => icon.src === '/favicon.svg'));
    assert.equal(manifest.screenshots, undefined);
    assert.equal(manifest.share_target, undefined);
});

test('disabled tabs are omitted from the native tab bar', () => {
    const settings = normalizePwaSettings({
        tabs: defaultPwaSettings.tabs.map((tab, index) => ({ ...tab, enabled: index < 3 })),
    });
    assert.deepEqual(enabledPwaTabs(settings).map((tab) => tab.id), ['home', 'journal', 'projects']);
});

test('install banners and the service worker stay off unless explicitly enabled', () => {
    const settings = normalizePwaSettings({
        showInstallPrompt: true,
        serviceWorkerEnabled: true,
        displayOverrideWco: true,
        shareTargetEnabled: true,
        icon192Url: '/icons/icon-192.png',
        screenshotNarrowUrl: '/screenshots/phone.png',
    });
    assert.equal(settings.showInstallPrompt, true);
    assert.equal(settings.serviceWorkerEnabled, true);

    const manifest = pwaSettingsToManifest(settings);
    assert.deepEqual(manifest.display_override, ['window-controls-overlay', 'standalone']);
    assert.equal(manifest.share_target.action, '/contact');
    assert.ok(manifest.icons.some((icon) => icon.sizes === '192x192'));
    assert.equal(manifest.screenshots[0].form_factor, 'narrow');
});

test('http screenshots and icons are stripped', () => {
    const settings = normalizePwaSettings({
        icon192Url: 'http://evil.example/icon.png',
        screenshotWideUrl: 'javascript:alert(1)',
        maskableIconUrl: 'https://cdn.example/maskable.png',
    });
    assert.equal(settings.icon192Url, '');
    assert.equal(settings.screenshotWideUrl, '');
    assert.equal(settings.maskableIconUrl, 'https://cdn.example/maskable.png');
});
