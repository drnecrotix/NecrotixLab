import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const script = readFileSync(new URL('../../public/pwa-sw.js', import.meta.url), 'utf8');
function harness(overrides = {}) {
    const events = {};
    const self = { location: new URL('https://example.com/pwa-sw.js?offline=1'), addEventListener: (name, callback) => events[name] = callback, clients: { claim: async () => {} } };
    const context = vm.createContext({ self, URL, Response, caches: {}, ...overrides });
    vm.runInContext(script, context);
    return { events, context };
}
test('activation preserves caches belonging to other applications', async () => {
    const deleted = [];
    const {events} = harness({caches: {keys: async () => ['other-app', 'necrotix-pwa-vold'], delete: async key => deleted.push(key)}});
    let work; events.activate({waitUntil: p => work = p}); await work;
    assert.deepEqual(deleted, ['necrotix-pwa-vold']);
});
test('generated icons, manifest and private routes bypass offline cache', () => {
    const {events} = harness();
    for (const path of ['/admin', '/api/media', '/pwa/icon/192?v=new', '/manifest.webmanifest']) {
        events.fetch({request: {method:'GET', url:'https://example.com'+path, mode:'navigate'}, respondWith: () => assert.fail('Must bypass cache')});
    }
});
test('offline page survives failure of optional precache pages', async () => {
    const added = [];
    const {events} = harness({caches: {open: async () => ({add: async path => {added.push(path); if(path==='/gallery') throw Error('unavailable');}})}});
    let work; events.install({waitUntil:p=>work=p}); await work;
    assert.ok(added.includes('/offline.html'));
});
test('storage failure does not replace successful navigation with an error', async () => {
    const {events} = harness({fetch:async()=>new Response('online'), caches:{open:async()=>({put:async()=>{throw Error('quota');}})}});
    let result; events.fetch({request:{method:'GET',url:'https://example.com/blog',mode:'navigate'},respondWith:p=>result=p});
    assert.equal(await (await result).text(), 'online');
});
