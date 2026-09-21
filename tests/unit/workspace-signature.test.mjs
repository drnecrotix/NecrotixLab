import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { signWorkspacePayload } from '../../src/modules/service-requests/workspace-signature.ts';

test('signs the exact timestamp and raw workspace payload', () => {
    const body = JSON.stringify({ reference: 'KT-260921-ABC123' });
    const timestamp = '1789977600';
    const secret = 'test-workspace-secret-with-more-than-32-characters';
    const expected = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
    assert.equal(signWorkspacePayload(body, timestamp, secret), expected);
    assert.notEqual(signWorkspacePayload(`${body} `, timestamp, secret), expected);
});
