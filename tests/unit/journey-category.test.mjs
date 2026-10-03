import test from 'node:test';
import assert from 'node:assert/strict';
import { journeyCategoryId, journeyPeriod, journeyDate, journeyThumbnail, journeyTimelineGroups } from '../../src/lib/journey-category.ts';
const categories = [{id:'professional',prefix:'prof-'},{id:'leadership',prefix:'lead-'}];
test('explicit categories override legacy prefixes without changing record IDs',()=>{
 assert.equal(journeyCategoryId({id:'prof-1',categoryId:'leadership'},categories),'leadership');
 assert.equal(journeyCategoryId({id:'lead-1'},categories),'leadership');
 assert.equal(journeyCategoryId({id:'old-entry'},categories),'professional');
});
test('missing and partial dates do not imply ongoing employment',()=>{
 assert.equal(journeyPeriod('',''), '');
 assert.equal(journeyPeriod('','2018'), '2018');
 assert.equal(journeyPeriod('2016',''), '2016');
 assert.equal(journeyPeriod('','',true), 'Present');
 assert.equal(journeyPeriod('2016','2018',true), '2016 - Present');
 assert.equal(journeyDate('2018'), '2018');
 assert.equal(journeyDate(''), '');
 assert.equal(journeyDate('Unknown'), 'Unknown');
});
test('thumbnail links allow media paths and web URLs, reject executable and ambiguous URLs',()=>{
 assert.equal(journeyThumbnail('/uploads/work.jpg'), '/uploads/work.jpg');
 assert.equal(journeyThumbnail('https://example.com/photo.jpg'), 'https://example.com/photo.jpg');
 for(const value of ['javascript:alert(1)','data:text/html,test','//evil.test','/\\evil.test','https://user:pass@example.com/photo.jpg','']) assert.equal(journeyThumbnail(value), undefined);
});

test('timeline preserves manual order including undated entries and repeated years',()=>{
 const entries = [{id:'a',startDate:'2018'}, {id:'b',startDate:''}, {id:'c',startDate:'2018'}, {id:'d',startDate:'',endDate:'2022'}];
 const groups = journeyTimelineGroups(entries);
 assert.deepEqual(groups.map(group=>group.title),['2018','Undated','2018','2022']);
 assert.deepEqual(groups.flatMap(group=>group.experiences.map(entry=>entry.id)), ['a','b','c','d']);
});
