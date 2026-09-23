import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeGCode } from '../../src/modules/gcode/parser.ts';

test('G-Code analyser follows absolute and incremental XY moves', () => {
    const result = analyzeGCode('G21 G90\nG0 X10 Y5\nG91\nG1 X5 Y-2 F200\nM30');
    assert.deepEqual(result.points.at(-1), { x: 15, y: 3, rapid: false, line: 4 });
    assert.equal(result.motionCount, 2);
    assert.ok(result.issues.every((issue) => issue.level === 'warning'));
    assert.ok(result.issues.some((issue) => issue.message.includes('G17')));
});

test('G-Code analyser reports malformed text and missing end command', () => {
    const result = analyzeGCode('G1 X10 BAD F0');
    assert.ok(result.issues.some((issue) => issue.level === 'error' && issue.message.includes('parse')));
    assert.ok(result.issues.some((issue) => issue.message.includes('Feed rate')));
    assert.ok(result.issues.some((issue) => issue.message.includes('M2 or M30')));
});

test('G2 arc samples a clockwise quarter-circle and tracks its source line', () => {
    const result = analyzeGCode('G21 G90 G17\nG0 Z5\nG0 X10 Y0\nG2 X0 Y-10 I-10 J0 F200\nM30');
    assert.ok(result.points.length > 5);
    assert.deepEqual(result.points.at(-1), { x: 0, y: -10, rapid: false, line: 4 });
    assert.equal(result.motionCount, 2);
    assert.ok(Math.abs(result.distance - (10 + Math.PI * 5)) < .2);
});
