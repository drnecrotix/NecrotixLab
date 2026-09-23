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

test('explains Z and M-code state on every source line', () => {
    const result = analyzeGCode('G21 G90 G17\nG0 Z10\nM3 S8000\nM8\nG1 Z-2 F100\nM5\nM30');
    assert.equal(result.frames.length, 7);
    assert.equal(result.frames[1].z, 10);
    assert.equal(result.frames[2].spindle, 'clockwise');
    assert.equal(result.frames[2].spindleSpeed, 8000);
    assert.equal(result.frames[3].coolant, true);
    assert.equal(result.frames[4].z, -2);
    assert.match(result.frames[4].action, /Linear feed/);
    assert.equal(result.frames[5].spindle, 'off');
});

test('does not invent XY motion for G53 machine coordinates', () => {
    const result = analyzeGCode('G21 G90 G17\nG0 Z5\nG53 G0 X200 Y200\nM30');
    assert.deepEqual(result.points.at(-1), { x: 0, y: 0, rapid: true, line: 0 });
    assert.ok(result.issues.some((issue) => issue.line === 3 && issue.message.includes('not previewed')));
});
