import assert from 'node:assert/strict';
import test from 'node:test';

import { uniqueProjectLabels, withoutProjectLabelDuplicates } from '../../src/lib/project-labels.ts';
import { normalizeProjectStatus, PROJECT_STATUS_DETAILS } from '../../src/lib/project-status.ts';

test('all CMS project statuses keep their public meaning', () => {
    assert.equal(normalizeProjectStatus('PLANNED'), 'planned');
    assert.equal(normalizeProjectStatus('ONGOING'), 'ongoing');
    assert.equal(normalizeProjectStatus('COMPLETED'), 'completed');
    assert.equal(normalizeProjectStatus('ARCHIVED'), 'archived');
    assert.equal(PROJECT_STATUS_DETAILS.planned.label, 'Planned');
});

test('unknown and missing statuses default safely to planned', () => {
    assert.equal(normalizeProjectStatus(undefined), 'planned');
    assert.equal(normalizeProjectStatus('unexpected'), 'planned');
});

test('stack labels are trimmed and deduplicated without changing their order', () => {
    assert.deepEqual(
        uniqueProjectLabels(['Next.js', ' TypeScript '], ['next.JS', 'Figma', 'figma']),
        ['Next.js', 'TypeScript', 'Figma'],
    );
});

test('tools already listed as technologies are removed', () => {
    assert.deepEqual(
        withoutProjectLabelDuplicates(['Docker', 'GitHub Actions', 'docker'], ['Next.js', 'DOCKER']),
        ['GitHub Actions'],
    );
});
