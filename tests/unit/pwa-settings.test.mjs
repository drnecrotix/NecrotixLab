import assert from 'node:assert/strict';
import test from 'node:test';

import {
    PWA_GENERATED_PACK,
    applyGeneratedIconPack,
    defaultPwaSettings,
    enabledPwaTabs,
    isPwaReaderPath,
    normalizePwaSettings,
    pwaSettingsToManifest,
    resolvedPwaIconUrls,
} from '../../src/lib/pwa-settings.ts';
import { appleSplashEntries, parseSplashSize, PWA_SCREENSHOT_WIDE } from '../../src/lib/pwa-icons.ts';

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
    assert.equal(settings.appBadgeEnabled, true);
    assert.equal(settings.iconAutoPack, true);
    assert.equal(settings.splashStyle, 'logo-name');
    assert.equal(settings.readerModeEnabled, true);
    assert.equal(settings.icon192Url, PWA_GENERATED_PACK.icon192);
});

test('unknown values and javascript urls are rejected', () => {
    const settings = normalizePwaSettings({
        display: 'window-controls-overlay',
        startUrl: 'javascript:alert(1)',
        iconUrl: 'http://insecure.example/icon.png',
        themeColor: 'red',
        handleLinks: 'always',
        launchHandler: 'popup',
        splashStyle: 'cinematic',
        readerTheme: 'neon',
        categories: ['malware', 'portfolio'],
        tabs: [{ id: 'x', label: 'Lab', href: '/lab', icon: 'not-an-icon', enabled: true }],
    });

    assert.equal(settings.display, 'standalone');
    assert.equal(settings.startUrl, '/blog');
    assert.equal(settings.iconUrl, '/favicon.svg');
    assert.equal(settings.themeColor, '#0c0a12');
    assert.equal(settings.handleLinks, 'preferred');
    assert.equal(settings.launchHandler, 'navigate-existing');
    assert.equal(settings.splashStyle, 'logo-name');
    assert.equal(settings.readerTheme, 'paper');
    assert.deepEqual(settings.categories, ['portfolio']);
    assert.equal(settings.tabs[0].icon, 'home');
    assert.equal(settings.tabs[0].href, '/lab');
});

test('manifest uses the generated pack from one logo by default', () => {
    const manifest = pwaSettingsToManifest(defaultPwaSettings);
    assert.equal(manifest.name, 'NecrotixLab');
    assert.equal(manifest.short_name, 'NecrotixLab');
    assert.equal(manifest.start_url, '/blog');
    assert.equal(manifest.display, 'standalone');
    assert.equal(manifest.theme_color, '#0c0a12');
    assert.equal(manifest.handle_links, 'preferred');
    assert.equal(manifest.launch_handler.client_mode, 'navigate-existing');
    assert.ok(manifest.icons.some((icon) => icon.src === PWA_GENERATED_PACK.icon192 && icon.sizes === '192x192'));
    assert.ok(manifest.icons.some((icon) => icon.purpose === 'maskable' && icon.src === PWA_GENERATED_PACK.maskable));
    assert.ok(manifest.icons.some((icon) => icon.purpose === 'monochrome'));
    assert.equal(manifest.screenshots.length, 2);
    assert.equal(manifest.screenshots[0].form_factor, 'narrow');
    assert.equal(manifest.screenshots[1].form_factor, 'wide');
    assert.equal(manifest.shortcuts[0].icons[0].sizes, '96x96');
    assert.equal(manifest.shortcuts[0].icons[0].src, PWA_GENERATED_PACK.icon96);
    assert.equal(manifest.share_target, undefined);
});

test('auto pack ignores per-size uploads until it is turned off', () => {
    const packed = normalizePwaSettings({
        iconUrl: '/uploads/mark.jpg',
        icon192Url: '/uploads/custom-192.png',
        iconAutoPack: true,
    });
    assert.equal(resolvedPwaIconUrls(packed).icon192, PWA_GENERATED_PACK.icon192);

    const manual = normalizePwaSettings({
        icon192Url: '/uploads/custom-192.png',
        iconAutoPack: false,
    });
    assert.equal(resolvedPwaIconUrls(manual).icon192, '/uploads/custom-192.png');

    const rebuilt = applyGeneratedIconPack(manual);
    assert.equal(rebuilt.iconAutoPack, true);
    assert.equal(rebuilt.icon192Url, PWA_GENERATED_PACK.icon192);
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
        iconAutoPack: false,
        icon192Url: '/icons/icon-192.png',
        screenshotNarrowUrl: '/screenshots/phone.png',
        splashStyle: 'wordmark',
        readerModeEnabled: false,
    });
    assert.equal(settings.showInstallPrompt, true);
    assert.equal(settings.serviceWorkerEnabled, true);
    assert.equal(settings.splashStyle, 'wordmark');
    assert.equal(settings.readerModeEnabled, false);

    const manifest = pwaSettingsToManifest(settings);
    assert.deepEqual(manifest.display_override, ['window-controls-overlay', 'standalone']);
    assert.equal(manifest.share_target.action, '/contact');
    assert.ok(manifest.icons.some((icon) => icon.src === '/icons/icon-192.png'));
    assert.equal(manifest.screenshots[0].src, '/screenshots/phone.png');
});

test('http screenshots and icons are stripped back to generated PNG defaults', () => {
    const settings = normalizePwaSettings({
        icon192Url: 'http://evil.example/icon.png',
        screenshotWideUrl: 'javascript:alert(1)',
        maskableIconUrl: 'https://cdn.example/maskable.png',
        splashImageUrl: 'javascript:alert(1)',
    });
    assert.equal(settings.icon192Url, PWA_GENERATED_PACK.icon192);
    assert.equal(settings.screenshotWideUrl, PWA_SCREENSHOT_WIDE);
    assert.equal(settings.maskableIconUrl, 'https://cdn.example/maskable.png');
    assert.equal(settings.splashImageUrl, '');
});

test('reader mode covers journal articles and wiki publications', () => {
    assert.equal(isPwaReaderPath('/blog/the-time'), true);
    assert.equal(isPwaReaderPath('/blog'), false);
    assert.equal(isPwaReaderPath('/wiki'), true);
    assert.equal(isPwaReaderPath('/wiki/faq'), true);
    assert.equal(isPwaReaderPath('/wiki/bg-gamer'), true);
    assert.equal(isPwaReaderPath('/wiki/articles'), false);
    assert.equal(isPwaReaderPath('/wiki/articles/extra'), false);
    assert.equal(isPwaReaderPath('/projects'), false);
});

test('apple splash specs are unique device triples with bounded sizes', () => {
    const entries = appleSplashEntries();
    assert.ok(entries.length >= 20);
    const keys = entries.map((entry) => `${entry.media}|${entry.pixelWidth}x${entry.pixelHeight}`);
    assert.equal(new Set(keys).size, keys.length);
    assert.ok(parseSplashSize('1170x2532'));
    assert.equal(parseSplashSize('9999x9999'), null);
    assert.equal(parseSplashSize('javascript:alert(1)'), null);
});
