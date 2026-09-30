import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeUrl } from '../../src/modules/url-scam/analyze.ts';
test('uses public and private suffix boundaries rather than last two labels', () => {
 assert.equal(analyzeUrl('https://paypal.login.attacker.co.uk').domain, 'attacker.co.uk');
 assert.equal(analyzeUrl('https://user.github.io').domain, 'user.github.io');
 assert.ok(analyzeUrl('https://paypal.login.attacker.co.uk').findings.some(f => f.severity === 'high'));
});
test('identifies actual host behind credentials and normalizes numeric hosts', () => {
 assert.equal(analyzeUrl('https://google.com@evil.example').hostname, 'evil.example');
 assert.ok(analyzeUrl('https://google.com@evil.example').findings.some(f => f.title === 'Embedded credentials'));
 assert.equal(analyzeUrl('http://2130706433').hostname, '127.0.0.1');
});
test('rejects executable schemes and never calls a clean URL safe', () => {
 assert.throws(() => analyzeUrl('javascript://alert(1)'));
 assert.throws(() => analyzeUrl('https://' + 'a'.repeat(4100)));
 assert.equal(analyzeUrl('https://example.com').verdict, 'No URL warning signs found');
});
