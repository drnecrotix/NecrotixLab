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
});

test('unknown values and javascript urls are rejected', () => {
    const settings = normalizePwaSettings({
        display: 'window-controls-overlay',
        startUrl: 'javascript:alert(1)',
        iconUrl: 'http://insecure.example/icon.png',
        themeColor: 'red',
        tabs: [{ id: 'x', label: 'Lab', href: '/lab', icon: 'not-an-icon', enabled: true }],
    });

    assert.equal(settings.display, 'standalone');
    assert.equal(settings.startUrl, '/blog');
    assert.equal(settings.iconUrl, '/favicon.svg');
    assert.equal(settings.themeColor, '#0c0a12');
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
    assert.equal(manifest.icons[0].src, '/favicon.svg');
});

test('disabled tabs are omitted from the native tab bar', () => {
    const settings = normalizePwaSettings({
        tabs: defaultPwaSettings.tabs.map((tab, index) => ({ ...tab, enabled: index < 3 })),
    });
    assert.deepEqual(enabledPwaTabs(settings).map((tab) => tab.id), ['home', 'journal', 'projects']);
});
