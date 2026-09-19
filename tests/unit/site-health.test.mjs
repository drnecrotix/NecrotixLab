import assert from 'node:assert/strict';
import test from 'node:test';
import { overallStatus, securityScore } from '../../src/lib/site-health.ts';

function check(status) {
  return { id: status, category: 'Test', label: status, status, summary: status, detail: status, impact: status, resolution: [] };
}

test('operational status reports the most severe check', () => {
  assert.equal(overallStatus([check('ok'), check('warning')]), 'warning');
  assert.equal(overallStatus([check('warning'), check('error')]), 'error');
  assert.equal(overallStatus([check('ok')]), 'ok');
});

test('security score gives warnings half credit', () => {
  assert.equal(securityScore([check('ok'), check('warning'), check('error')]), 50);
  assert.equal(securityScore([]), 0);
});
