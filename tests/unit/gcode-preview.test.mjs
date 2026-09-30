import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeGCode } from '../../src/modules/gcode/parser.ts';
import { toolpathSegments, visibleToolpath } from '../../src/modules/gcode/preview.ts';
test('omits assumed-origin connectors and does not draw zero-distance blocks', () => {
 const segments=toolpathSegments(analyzeGCode('G21 G90 G17\nG0 X10 Y10\nG1 X20 Y10 F100\nM30').points);
 assert.equal(segments.length,1); assert.equal(segments[0].from.x,10); assert.equal(segments[0].to.x,20);
 assert.equal(toolpathSegments(analyzeGCode('G0 Z5\nG1 Z-1 F100\nM30').points).length,0);
});
test('renders only executed motion unless the planned path is explicitly requested', () => {
 const segments=toolpathSegments(analyzeGCode('G0 X0 Y0\nG1 X10 F100\nG0 Y10\nM30').points);
 assert.equal(visibleToolpath(segments,0).length,0);
 assert.equal(visibleToolpath(segments,2).length,1);
 assert.equal(visibleToolpath(segments,0,true).length,2);
 assert.equal(visibleToolpath(segments,3,false,false).length,1);
});
test('blank code has no paths and arcs with unknown starts are omitted', () => {
 assert.equal(toolpathSegments(analyzeGCode('').points).length,0);
 const r=analyzeGCode('G21 G90 G17\nG2 I10 J0 F100\nM30');
 assert.equal(toolpathSegments(r.points).length,0); assert.equal(r.previewComplete,false);
});
