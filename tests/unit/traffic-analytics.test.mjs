import assert from 'node:assert/strict';
import test from 'node:test';

import {
    TRAFFIC_CLEANUP_INTERVAL_HOURS,
    TRAFFIC_IP_RETENTION_HOURS,
    TRAFFIC_METRIC_RETENTION_DAYS,
    TRAFFIC_PAGE_EVENT_RETENTION_DAYS,
    normalizeAsn,
    latestLiveEventIds,
    trafficRetentionCutoffs,
} from '../../src/lib/traffic-analytics.ts';

test('traffic retention policy keeps identifying network context short-lived', () => {
    assert.equal(TRAFFIC_IP_RETENTION_HOURS, 24);
    assert.equal(TRAFFIC_PAGE_EVENT_RETENTION_DAYS, 30);
    assert.equal(TRAFFIC_METRIC_RETENTION_DAYS, 30);
    assert.equal(TRAFFIC_CLEANUP_INTERVAL_HOURS, 6);
});

test('traffic retention cutoffs are deterministic', () => {
    const now = new Date('2026-09-19T12:00:00.000Z');
    const cutoffs = trafficRetentionCutoffs(now);

    assert.equal(cutoffs.ipContext.toISOString(), '2026-09-18T12:00:00.000Z');
    assert.equal(cutoffs.pageEvent.toISOString(), '2026-08-20T12:00:00.000Z');
    assert.equal(cutoffs.metric.toISOString(), '2026-08-20T12:00:00.000Z');
    assert.equal(cutoffs.cleanupClaim.toISOString(), '2026-09-19T06:00:00.000Z');
});

test('ASN values are normalized for consistent display and search', () => {
    assert.equal(normalizeAsn(15169), 'AS15169');
    assert.equal(normalizeAsn('as13335'), 'AS13335');
    assert.equal(normalizeAsn('not-an-asn'), null);
});

test('only the latest matching page event is marked live for a visitor session', () => {
    const currentPaths = new Map([['visitor-a', '/projects']]);
    const liveIds = latestLiveEventIds([
        { id: 'newest', sessionHash: 'visitor-a', path: '/projects' },
        { id: 'older-same-page', sessionHash: 'visitor-a', path: '/projects' },
        { id: 'old-home', sessionHash: 'visitor-a', path: '/' },
    ], currentPaths);

    assert.equal(liveIds.get('visitor-a'), 'newest');
    assert.equal([...liveIds.values()].includes('older-same-page'), false);
});

test('a stale heartbeat cannot mark an older page live after navigation', () => {
    const liveIds = latestLiveEventIds([
        { id: 'latest-a', sessionHash: 'visitor-a', path: '/gallery' },
        { id: 'latest-b', sessionHash: 'visitor-b', path: '/blog' },
        { id: 'older-a', sessionHash: 'visitor-a', path: '/projects' },
    ], new Map([['visitor-a', '/projects'], ['visitor-b', '/blog']]));
    assert.equal(liveIds.has('visitor-a'), false);
    assert.equal(liveIds.get('visitor-b'), 'latest-b');
});
