import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { parsePwaVersionPayload, shouldOfferPwaUpdate } from '../../src/lib/pwa-update.ts';

test('first visit does not offer an update', () => {
    assert.equal(shouldOfferPwaUpdate(null, '1.3.34'), false);
    assert.equal(shouldOfferPwaUpdate('', '1.3.34'), false);
});

test('a newer remote version offers an update', () => {
    assert.equal(shouldOfferPwaUpdate('1.3.33', '1.3.34'), true);
    assert.equal(shouldOfferPwaUpdate('1.3.34', '1.3.34'), false);
    assert.equal(shouldOfferPwaUpdate('1.3.34', 'unknown'), false);
    assert.equal(shouldOfferPwaUpdate('1.3.34', ''), false);
});

test('version payload is a trimmed string', () => {
    assert.equal(parsePwaVersionPayload({ version: '1.3.34' }), '1.3.34');
    assert.equal(parsePwaVersionPayload({ version: ' 1.3.34 ' }), '1.3.34');
    assert.equal(parsePwaVersionPayload({ version: 2 }), '');
    assert.equal(parsePwaVersionPayload(null), '');
});

test('service worker APP_VERSION matches package.json', () => {
    const version = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version;
    const sw = readFileSync(new URL('../../public/pwa-sw.js', import.meta.url), 'utf8');
    assert.match(sw, new RegExp(`APP_VERSION = '${version}'`));
});
