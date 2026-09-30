import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeGCode } from '../../src/modules/gcode/parser.ts';
import { classifySegments, motionSegments, toolpathSegments, projectPoint } from '../../src/modules/gcode/preview.ts';
test('Z-only moves appear in depth without inventing XY geometry', () => {
 const r=analyzeGCode('G21 G90 G17\nG0 X0 Y0\nG0 Z5\nM3 S12000\nG1 Z-2 F100\nG0 Z5');
 assert.equal(toolpathSegments(r.points).length,0);
 assert.equal(toolpathSegments(r.points,'xz').length,3);
 assert.deepEqual(projectPoint(r.points.at(-1),'yz'),{x:0,y:5});
 const plunge=classifySegments(motionSegments(r.points),0).filter(s=>s.to.line===5);
 assert.deepEqual(plunge.map(s=>s.kind),['air','cutting']);
 assert.equal(plunge[0].to.z,0); assert.equal(plunge[1].from.z,0);
 const retract=classifySegments(motionSegments(r.points),0).filter(s=>s.to.line===6);
 assert.deepEqual(retract.map(s=>s.kind),['rapid-low','rapid']);
});
test('spindle state and configured stock surface determine potential contact',()=>{
 const r=analyzeGCode('G0 X0 Y0 Z-1\nG1 X10 F100\nM3 S1000\nG1 X20\nM5\nG1 X30');
 const s=motionSegments(r.points);
 assert.deepEqual(classifySegments(s,0).map(s=>s.kind),['spindle-off','cutting','spindle-off']);
 assert.ok(classifySegments(s,-2).every(s=>s.kind==='air'));
});
test('helical arc samples interpolate Z rather than flatten depth',()=>{
 const r=analyzeGCode('G21 G90 G17\nG0 X10 Y0 Z5\nM3 S1000\nG3 X0 Y10 Z-5 I-10 J0 F100');
 const arc=r.points.filter(p=>p.line===4);
 assert.ok(arc.length>5); assert.equal(arc.at(-1).z,-5);
 assert.ok(arc.some(p=>p.z>0)&&arc.some(p=>p.z<0));
 assert.ok(arc.every(p=>p.spindleActive));
});
test('a Z positioning block does not establish a fictional first XY connector',()=>{
 const r=analyzeGCode('G0 Z5\nG0 X100 Y100\nG1 X110 F100');
 const s=toolpathSegments(r.points);
 assert.equal(s.length,1); assert.equal(s[0].from.x,100);
});
