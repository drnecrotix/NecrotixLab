import assert from 'node:assert/strict';
import test from 'node:test';
import { formatGCode, insertAtSelection, toggleLineComment } from '../../src/modules/gcode/editor.ts';

test('formats words without altering comments and supports cursor insertion', () => {
    assert.equal(formatGCode(' g 21   g 90 ; keep this\n(comment with text) g 0 x 10'), 'G21 G90 ; keep this\n(comment with text) G0 X10');
    assert.deepEqual(insertAtSelection('G0 X0\nM30', 0, 5, 'G0 X10'), { text: 'G0 X10\nM30', cursor: 6 });
});

test('toggles comments for selected lines', () => {
    const added = toggleLineComment('G0 X0\nM30', 0, 10);
    assert.equal(added.text, '; G0 X0\n; M30');
    assert.equal(toggleLineComment(added.text, 0, added.text.length).text, 'G0 X0\nM30');
});
