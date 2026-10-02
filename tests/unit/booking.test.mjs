import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingDestination } from '../../src/lib/booking.ts';

test('booking stays disabled for missing or unsafe operator configuration', () => {
    for (const value of [undefined, '', '   ', '/booking', 'http://example.com', 'javascript:alert(1)', 'https://user:secret@example.com', 'https://example.com?redirect=other', 'https://example.com#token']) {
        assert.equal(bookingDestination(value), null);
    }
});
test('booking preserves an HTTPS installation subdirectory', () => {
    assert.equal(bookingDestination(' https://booking.example.com/appointments/ '), 'https://booking.example.com/appointments/');
});
