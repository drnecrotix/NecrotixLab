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

test('untitled lists after a features marker remain prose', () => {
    const groups = featuresFromHtml('<ul><li>Local SEO.</li><li>Simple home page</li></ul>');
    assert.deepEqual(groups, []);
});

test('titled feature lists become cards with nested editor paragraphs', () => {
    const groups = featuresFromHtml('<h2>Discovery</h2><ul><li><p>Local SEO.</p></li><li><p>Simple home page</p></li></ul>');
    assert.deepEqual(groups, [{ title: 'Discovery', items: ['Local SEO.', 'Simple home page'] }]);
});

test('copy following a titled feature list is an independent document segment', () => {
    const body = '<h2>Discovery</h2><ul><li>Local SEO</li></ul><p>The project is built for players.</p>';
    assert.deepEqual(featuresFromHtml(body), []);
    const segments = composeProjectLayout(`[[features]]${body}`);
    assert.deepEqual(segments[0], { type: 'block', block: 'features' });
    assert.equal(segments[1].type, 'html');
    if (segments[1].type !== 'html') throw new Error('expected normal content');
    assert.match(segments[1].html, /built for players/);
});

test('layout keeps list HTML after the features block as normal content', () => {
    const segments = composeProjectLayout('<p>Hello</p>[[features]]<ul><li>Local SEO.</li></ul>');
    assert.equal(segments[0].type, 'html');
    assert.deepEqual(segments[1], { type: 'block', block: 'features' });
    assert.equal(segments[2].type, 'html');
    if (segments[2].type !== 'html') throw new Error('expected list content');
    assert.match(segments[2].html, /Local SEO/);
    assert.equal(segments.length, 3);
});

test('screenshot-style untitled list stays outside the Features block', () => {
    const html = [
        '<p>Mirko Build Stroy is a professional web project.</p>',
        '<div class="my-3" data-project-block="features"><div>Features REMOVE</div></div>',
        '<ul><li><p>Local SEO.</p></li><li><p>Simple home page</p></li></ul>',
    ].join('');
    const layout = normalizeProjectBlockMarkers(html);
    const segments = composeProjectLayout(layout);
    const features = segments.find((segment) => segment.type === 'block' && segment.block === 'features');
    assert.ok(features && features.type === 'block');
    assert.equal(features.body, undefined);
    assert.equal(segments[2].type, 'html');
    if (segments[2].type !== 'html') throw new Error('expected independent list');
    assert.match(segments[2].html, /Local SEO/);
});

test('every project block leaves following text independent', () => {
    for (const block of ['mission', 'features', 'chronicles', 'installation']) {
        const segments = composeProjectLayout(`[[${block}]]<p>Text after ${block}</p>`);
        assert.deepEqual(segments[0], { type: 'block', block });
        assert.deepEqual(segments[1], { type: 'html', html: `<p>Text after ${block}</p>` });
    }
});

test('installation code blocks are parsed from following HTML', () => {
    const steps = installationFromHtml('<pre><code>npm install</code></pre>');
    assert.equal(steps[0]?.type, 'code');
    assert.equal(steps[0]?.cmd, 'npm install');
});

test('paired project blocks stop at their matching end marker', () => {
    for (const block of ['mission', 'features', 'chronicles', 'installation']) {
        const html = `<p data-project-block="${block}">[[${block}]]</p><p>Inside</p><p data-project-block="${block}" data-project-block-end="true">[[/${block}]]</p><p>Outside</p>`;
        const segments = composeProjectLayout(normalizeProjectBlockMarkers(html));
        assert.deepEqual(segments[0], { type: 'block', block, body: '<p>Inside</p>' });
        assert.deepEqual(segments[1], { type: 'html', html: '<p>Outside</p>' });
    }
});

test('matching ends do not consume another block or following prose', () => {
    const segments = composeProjectLayout('[[features]]<h2>Search</h2><ul><li>Fast</li></ul>[[/features]]<p>Next</p>[[mission]]<p>Legacy copy</p>');
    assert.deepEqual(featuresFromHtml(segments[0].body), [{ title: 'Search', items: ['Fast'] }]);
    assert.deepEqual(segments[1], { type: 'html', html: '<p>Next</p>' });
    assert.deepEqual(segments[2], { type: 'block', block: 'mission' });
    assert.deepEqual(segments[3], { type: 'html', html: '<p>Legacy copy</p>' });
});
