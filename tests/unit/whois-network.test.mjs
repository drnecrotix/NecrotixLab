import test from 'node:test';
import assert from 'node:assert/strict';
import { isProbeAddress, probePort } from '../../src/modules/whois/network.ts';

test('rejects internal, reserved, mapped and transition targets before connecting', () => {
    for (const ip of ['127.0.0.1', '10.0.0.1', '172.16.0.1', '192.168.0.1', '169.254.169.254', '100.64.0.1', '192.0.2.1', '198.18.0.1', '224.0.0.1', '::1', '::', 'fc00::1', 'fe80::1', '::ffff:127.0.0.1', '::ffff:7f00:1', '2001:db8::1', '2002:7f00:1::', '2001:0::1', 'invalid']) {
        assert.equal(isProbeAddress(ip), false, ip);
        assert.throws(() => probePort(ip, 443));
    }
});
test('accepts ordinary public IPv4/IPv6 and rejects arbitrary ports', () => {
    for (const ip of ['1.1.1.1', '8.8.8.8', '2606:4700::1111', '2a00:1450::1']) assert.equal(isProbeAddress(ip), true);
    assert.throws(() => probePort('1.1.1.1', 12345));
});
