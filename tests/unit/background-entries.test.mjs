import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeBackgroundEntries } from '../../src/lib/background-entries.ts';
const state = () => ({education:{},journey:{},experience:{}});
test('identical copies collapse without exposing hidden or archived records', () => {
 const entry = {id:'prof-1', position:'Operator'};
 const flags = state(); flags.journey[entry.id] = {hidden:true,archived:false};
 const result = mergeBackgroundEntries([entry], [{...entry}], flags);
 assert.equal(result.entries.length, 1);
 assert.equal(result.state.experience[entry.id].hidden, true);
 assert.deepEqual(result.state.journey, {});
 assert.equal(flags.journey[entry.id].hidden, true);
});
test('different legacy revisions and colliding IDs survive with their visibility flags', () => {
 const flags = state(); flags.journey.x = {hidden:false,archived:true};
 const result = mergeBackgroundEntries([{id:'x',position:'New'}, {id:'x-legacy',position:'Existing'}], [{id:'x',position:'Old'}], flags);
 assert.equal(result.entries.length, 3);
 assert.equal(result.entries[2].id, 'x-legacy-1');
 assert.equal(result.state.experience['x-legacy-1'].archived, true);
 const again = mergeBackgroundEntries(result.entries, [], result.state);
 assert.deepEqual(again, result);
});
