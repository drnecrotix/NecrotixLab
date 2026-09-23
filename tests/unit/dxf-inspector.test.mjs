import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectDxf } from '../../src/modules/gcode/dxf.ts';

test('ASCII DXF inspector reads lines, closed polylines, layers and bounds', () => {
    const input = `0\nSECTION\n2\nENTITIES\n0\nLINE\n8\nCut\n10\n0\n20\n0\n11\n20\n21\n10\n0\nLWPOLYLINE\n8\nOutline\n70\n1\n10\n1\n20\n2\n10\n3\n20\n4\n0\nENDSEC\n0\nEOF`;
    const result = inspectDxf(input);
    assert.deepEqual(result.counts, { LINE: 1, LWPOLYLINE: 1 });
    assert.deepEqual(result.layers, ['Cut', 'Outline']);
    assert.deepEqual(result.bounds, { minX: 0, maxX: 20, minY: 0, maxY: 10 });
    assert.deepEqual(result.entities[1].points.at(-1), result.entities[1].points[0]);
});
