import assert from 'node:assert/strict';
import test from 'node:test';
import { socialDescription } from '../../src/lib/social-description.ts';

test('summarizes rich publication text without tags or encoded entities', () => {
    assert.equal(socialDescription('<h2>Mission</h2><p>Tom &amp; Jerry built a public project.</p>'), 'Mission Tom & Jerry built a public project.');
});

test('project block markers are excluded and longer text ends on a word boundary', () => {
    assert.equal(socialDescription('[[features]]<p>Clear project summary and remaining text</p>[[/features]]', 28), 'Clear project summary and…');
});

test('empty documents do not invent a description', () => {
    assert.equal(socialDescription('<p> </p>'), '');
});
