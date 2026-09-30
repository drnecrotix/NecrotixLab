import test from 'node:test';
import assert from 'node:assert/strict';
import { blockDuration, interpolateBlock } from '../../src/modules/gcode/playback.ts';
const point = (x,y,z,line) => ({x,y,z,line,rapid:false,spindleActive:true,xyKnown:true});
const points = [point(0,0,0,1),point(10,0,0,2),point(10,10,0,2)];
test('playback follows sampled segments by length rather than endpoint chord', () => {
  const p = interpolateBlock(points,2,.75,points[0]);
  assert.equal(p.x,10); assert.equal(p.y,5);
  assert.deepEqual(interpolateBlock(points,2,1,points[0]),points[2]);
  assert.deepEqual(interpolateBlock(points,2,0,points[0]),{...points[1],x:0});
  assert.deepEqual(interpolateBlock(points,3,.5,points[2]),points[2]);
});
test('feed timing respects inches and faster rapid travel', () => {
  const frame = {line:2,motion:'cut',feed:100,units:'mm'};
  assert.ok(blockDuration(points,frame,650) > blockDuration(points,{...frame,motion:'rapid'},650));
  assert.equal(blockDuration(points,{...frame,feed:254,units:'mm'},650),blockDuration(points,{...frame,feed:10,units:'in'},650));
});
