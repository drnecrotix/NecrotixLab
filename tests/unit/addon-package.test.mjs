import test from 'node:test';
import assert from 'node:assert/strict';
import { zipSync, strToU8 } from 'fflate';
import { compareVersions, parseAddonZip } from '../../src/modules/addons/package.ts';

const manifest = { format: 'necrotixlab-addon-v1', id: 'sample', name: 'Sample', version: '1.0.0', requiresCms: '1.3.72', description: 'A community addon' };
const archive = (files) => zipSync(Object.fromEntries(Object.entries(files).map(([path, text]) => [path, strToU8(text)])));

test('accepts one versioned addon manifest in its own folder', () => {
    const parsed = parseAddonZip(archive({ 'Addons/Sample/manifest.json': JSON.stringify(manifest), 'Addons/Sample/README.md': 'Hello' }));
    assert.equal(parsed.id, 'sample');
    assert.equal(parsed.directory, 'Sample');
});

test('rejects ambiguous, misplaced and invalid addon manifests', () => {
    assert.throws(() => parseAddonZip(archive({ 'manifest.json': JSON.stringify(manifest) })), /exactly one/);
    assert.throws(() => parseAddonZip(archive({ 'Addons/A/manifest.json': JSON.stringify(manifest), 'Addons/B/manifest.json': JSON.stringify(manifest) })), /exactly one/);
    assert.throws(() => parseAddonZip(archive({ 'Addons/A/manifest.json': JSON.stringify({ ...manifest, id: '../bad' }) })), /invalid fields/);
});

test('compares semantic versions numerically', () => {
    assert.ok(compareVersions('1.3.10', '1.3.9') > 0);
    assert.ok(compareVersions('1.4.0', '1.3.99') > 0);
});
