import test from 'node:test';
import assert from 'node:assert/strict';
import { justifiedGalleryRows } from '../../src/lib/gallery-justified-layout.ts';
test('justified rows fit desktop and mobile without changing item order', () => {
    const ratios = [0.7, 1, 0.65, 1.8, 1.4, 0.9, 2, 1.5, 0.7, 1.2];
    for (const width of [320, 640, 1760]) {
        const rows = justifiedGalleryRows(ratios, width, width < 640 ? 155 : 250);
        assert.equal(rows.reduce((n, row) => n + row.count, 0), ratios.length);
        rows.forEach((row, i) => {
            assert.ok(row.height > 0);
            const total = row.widths.reduce((n, value) => n + value, 0) + (row.count - 1) * 8;
            assert.ok(total <= width + 0.001);
            if (i < rows.length - 1) assert.ok(Math.abs(total - width) < 0.001);
        });
    }
});
test('empty input, incomplete last row and invalid image dimensions are bounded', () => {
    assert.deepEqual(justifiedGalleryRows([], 600), []);
    assert.deepEqual(justifiedGalleryRows([1], 0), []);
    assert.equal(justifiedGalleryRows([1], 1200)[0].height, 240);
    for (const row of justifiedGalleryRows([NaN, 0, Infinity, -1], 320)) assert.ok(row.widths.every(Number.isFinite));
});
