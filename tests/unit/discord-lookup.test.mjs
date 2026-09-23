import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDiscordQuery, snowflakeDate } from '../../src/modules/discord-lookup/core.ts';

test('accepts Discord invite links and rejects unrelated hosts', () => {
  assert.equal(parseDiscordQuery('https://discord.gg/Example-1?utm=test', 'invite'), 'Example-1');
  assert.equal(parseDiscordQuery('https://discord.com/invite/abc123', 'invite'), 'abc123');
  assert.throws(() => parseDiscordQuery('https://discord.gg.evil.test/abc123', 'invite'));
});
test('validates snowflake IDs and decodes creation date', () => {
  const snowflake = String((BigInt(Date.UTC(2020, 0, 1) - 1420070400000) << 22n));
  assert.equal(parseDiscordQuery(snowflake, 'server'), snowflake);
  assert.equal(snowflakeDate(snowflake), '2020-01-01T00:00:00.000Z');
  assert.throws(() => parseDiscordQuery('abc', 'user'));
});
