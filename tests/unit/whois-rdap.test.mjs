import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registryUrls, summarizeRdap } from '../../src/modules/whois/rdap.ts';

test('IANA domain lookup selects longest matching suffix', () => {
  const services = [[['uk'], ['https://general.test/']], [['co.uk'], ['https://specific.test/']]];
  assert.deepEqual(registryUrls({ services }, 'example.co.uk', false), ['https://specific.test/']);
});
test('IANA network lookup selects most specific IPv4 and IPv6 prefixes', () => {
  const services = [[['1.0.0.0/8', '2000::/3'], ['https://broad.test/']], [['1.1.1.0/24', '2606:4700::/32'], ['https://specific.test/']]];
  assert.deepEqual(registryUrls({ services }, '1.1.1.1', true), ['https://specific.test/']);
  assert.deepEqual(registryUrls({ services }, '2606:4700::1111', true), ['https://specific.test/']);
});
test('summarizes public entity details and network information', () => {
  const summary = summarizeRdap({ cidr0_cidrs: [{ v4prefix: '1.1.1.0', length: 24 }], entities: [{ roles: ['registrar'], vcardArray: ['vcard', [['fn', {}, 'text', 'Example'], ['email', {}, 'text', 'public@example.org']]] }], secureDNS: { delegationSigned: true } });
  assert.deepEqual(summary.network, ['1.1.1.0/24']);
  assert.equal(summary.entities[0].email, 'public@example.org');
  assert.equal(summary.secureDns, true);
});
