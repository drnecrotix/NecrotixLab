import assert from 'node:assert/strict';
import test from 'node:test';
import { diagnosticPath, diagnosticCode } from '../../src/lib/runtime-errors.ts';
import { galleryImageWidth, galleryImageUrl } from '../../src/lib/gallery-image.ts';

test('diagnostics discard identity, query strings and fragments', () => {
    assert.equal(diagnosticPath('/gallery/private-name?email=niko@example.com#token'), '/gallery/[item]');
    assert.equal(diagnosticPath('https://example.com/api/users/123?secret=abc'), '/api/[item]/[item]');
    assert.equal(diagnosticPath('/contact'), '/contact');
    assert.equal(diagnosticCode('Error with password secret'), 'UnknownError');
    assert.equal(diagnosticCode('TypeError'), 'TypeError');
});

test('gallery uses bounded responsive media variants and retains scope', () => {
    assert.equal(galleryImageWidth(641), 960);
    assert.equal(galleryImageWidth(100000), 2560);
    assert.equal(galleryImageUrl('/api/protected-media/example?scope=gallery', 640), '/api/protected-media/example?scope=gallery&w=640');
    assert.equal(galleryImageUrl('https://example.com/image.jpg', 640), 'https://example.com/image.jpg');
});
