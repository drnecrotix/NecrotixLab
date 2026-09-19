import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldBypassImageOptimizer } from '../../src/lib/media-image.ts';

test('protected gallery media bypasses Next Image optimization', () => {
    assert.equal(
        shouldBypassImageOptimizer('/api/protected-media/cmt22un0h000076i3mp1eg5kx?scope=gallery'),
        true,
    );
    assert.equal(shouldBypassImageOptimizer('/api/protected-media/cmt22un0h000076i3mp1eg5kx'), true);
});

test('plain local uploads stay eligible for optimization', () => {
    assert.equal(shouldBypassImageOptimizer('/uploads/2026-09-16/nl_nb.png'), false);
    assert.equal(shouldBypassImageOptimizer(undefined), false);
});
