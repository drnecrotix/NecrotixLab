import test from 'node:test';
import assert from 'node:assert/strict';
import { clientIp } from '../../src/modules/whois/client-ip.ts';

test('reads valid proxy client address and normalizes mapped IPv4', () => {
  assert.equal(clientIp(new Headers({ 'cf-connecting-ip': '::ffff:1.1.1.1', 'x-forwarded-for': '2.2.2.2, 3.3.3.3' })), '1.1.1.1');
  assert.equal(clientIp(new Headers({ 'x-forwarded-for': '2606:4700::1111, 1.1.1.1' })), '2606:4700::1111');
  assert.equal(clientIp(new Headers({ 'x-real-ip': 'invalid', 'x-forwarded-for': '9.9.9.9' })), '9.9.9.9');
});
