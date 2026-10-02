import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { zipSync } from 'fflate';
import { calOrigin, calBookingPath, normalizeBookingConfig, bookingReady, bookingEmbedUrl } from '../../Addons/Booking/settings.ts';
import { parseAddonZip } from '../../src/modules/addons/package.ts';
test('Booking fails closed without an installed active configured package', () => {
    assert.equal(bookingReady(normalizeBookingConfig(null), 'https://booking.example.com'), false);
    const services = [{ path: 'owner/consultation', title: 'Consultation' }];
    assert.equal(bookingReady(normalizeBookingConfig({ active: true, services }), 'https://booking.example.com'), false);
    assert.equal(bookingReady(normalizeBookingConfig({ installed: true, active: true, services }), null), false);
    assert.equal(bookingReady(normalizeBookingConfig({ installed: true, active: true, services }), 'https://booking.example.com'), true);
});
test('Booking permits only HTTPS origins and bounded event paths', () => {
    for (const origin of ['http://example.com', 'https://user:secret@example.com', 'https://example.com/path', 'https://example.com?x=1', 'https://example.com#x', "https://example.com; frame-src *"]) assert.equal(calOrigin(origin), null);
    for (const path of ['../admin', 'owner/event?redirect=evil', '//evil.example', 'owner/event/extra', 'owner/%2e%2e']) assert.equal(calBookingPath(path), '');
    assert.equal(calOrigin(' https://booking.example.com/ '), 'https://booking.example.com');
    const config = normalizeBookingConfig({ services: [{ path: 'owner/meeting', duration: Infinity }, { path: '../admin' }] });
    assert.equal(config.services.length, 1);
    assert.equal(config.services[0].duration, 480);
});
test('Embed always targets the configured instance and carries theme and language', () => {
    const url = new URL(bookingEmbedUrl('https://booking.example.com', 'owner/meeting', 'dark', 'bg'));
    assert.equal(url.origin, 'https://booking.example.com');
    assert.equal(url.pathname, '/owner/meeting');
    assert.equal(url.searchParams.get('theme'), 'dark');
    assert.equal(url.searchParams.get('locale'), 'bg');
    assert.throws(() => bookingEmbedUrl('https://example.com/other', 'owner/meeting', 'light', 'en'));
});
test('Booking package uses the existing validated addon archive format', () => {
    const manifest = readFileSync(new URL('../../Addons/Booking/manifest.json', import.meta.url));
    const parsed = parseAddonZip(zipSync({ 'Addons/Booking/manifest.json': manifest }));
    assert.equal(parsed.id, 'booking');
    assert.equal(parsed.directory, 'Booking');
    assert.equal(parsed.version, '1.0.0');
});
