import assert from 'node:assert/strict';
import test from 'node:test';

import {
    composeProjectLayout,
    featuresFromHtml,
    hoistProjectBlockNodes,
    installationFromHtml,
    normalizeProjectBlockMarkers,
} from '../../src/lib/project-blocks.ts';

test('node-view wrappers become shortcode tokens before sanitize', () => {
    const html = '<p>Intro</p><div class="my-3" data-project-block="features"><div class="card">Features REMOVE</div></div><ul><li>Local SEO.</li></ul>';
    const hoisted = hoistProjectBlockNodes(html);
    assert.match(hoisted, /\[\[features\]\]/);
    assert.doesNotMatch(hoisted, /data-project-block/);
    assert.match(hoisted, /Local SEO/);
});

test('data-project-block as the first attribute still hoists', () => {
    const html = '<div data-project-block="features" class="my-3"><p>Features</p></div><ul><li>Local SEO.</li></ul>';
    assert.equal(hoistProjectBlockNodes(html), '[[features]]<ul><li>Local SEO.</li></ul>');
});

test('paragraph tokens stay intact', () => {
    const html = '<p data-project-block="mission">[[mission]]</p><p>Body copy</p>';
    assert.equal(normalizeProjectBlockMarkers(html), '[[mission]]<p>Body copy</p>');
});

test('lists after a features marker become feature cards', () => {
    const groups = featuresFromHtml('<ul><li>Local SEO.</li><li>Simple home page</li></ul>');
    assert.deepEqual(groups, [{ title: 'Highlights', items: ['Local SEO.', 'Simple home page'] }]);
});

test('tiptap nested paragraphs inside list items still become cards', () => {
    const groups = featuresFromHtml('<ul><li><p>Local SEO.</p></li><li><p>Simple home page</p></li></ul>');
    assert.deepEqual(groups, [{ title: 'Highlights', items: ['Local SEO.', 'Simple home page'] }]);
});

test('layout attaches list HTML to the features block so it is not dropped', () => {
    const segments = composeProjectLayout('<p>Hello</p>[[features]]<ul><li>Local SEO.</li></ul>');
    assert.equal(segments[0].type, 'html');
    assert.equal(segments[1].type, 'block');
    if (segments[1].type !== 'block') throw new Error('expected block');
    assert.equal(segments[1].block, 'features');
    assert.match(segments[1].body || '', /Local SEO/);
    assert.equal(segments.length, 2);
});

test('screenshot-style HTML becomes a features section with cards', () => {
    const html = [
        '<p>Mirko Build Stroy is a professional web project.</p>',
        '<div class="my-3" data-project-block="features"><div>Features REMOVE</div></div>',
        '<ul><li><p>Local SEO.</p></li><li><p>Simple home page</p></li></ul>',
    ].join('');
    const layout = normalizeProjectBlockMarkers(html);
    const segments = composeProjectLayout(layout);
    const features = segments.find((segment) => segment.type === 'block' && segment.block === 'features');
    assert.ok(features && features.type === 'block');
    assert.deepEqual(featuresFromHtml(features.body), [{ title: 'Highlights', items: ['Local SEO.', 'Simple home page'] }]);
});

test('installation code blocks are parsed from following HTML', () => {
    const steps = installationFromHtml('<pre><code>npm install</code></pre>');
    assert.equal(steps[0]?.type, 'code');
    assert.equal(steps[0]?.cmd, 'npm install');
});
