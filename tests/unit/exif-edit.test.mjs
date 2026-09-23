import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { readEditableExif, writeEditableExif } from '../../src/modules/exif/edit-jpeg.ts';

test('JPEG EXIF editor writes selected fields and clears an existing field', async () => {
  const jpeg = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#fff' } }).jpeg().toBuffer();
  const original = `data:image/jpeg;base64,${jpeg.toString('base64')}`;
  const fields = readEditableExif(original);
  const first = writeEditableExif(original, { ...fields, make: 'Nikon', artist: 'Niko', lensModel: '50mm', software: 'NecrotixLab', dateTimeOriginal: '2026:09:23 10:20:30' });
  assert.equal(readEditableExif(first).artist, 'Niko');
  assert.equal(readEditableExif(first).dateTimeOriginal, '2026:09:23 10:20:30');
  assert.equal(readEditableExif(first).lensModel, '50mm');
  const cleared = writeEditableExif(first, { ...readEditableExif(first), artist: '' });
  assert.equal(readEditableExif(cleared).artist, '');
  assert.equal(readEditableExif(cleared).make, 'Nikon');
  const located = writeEditableExif(cleared, { ...readEditableExif(cleared), latitude: '42.5', longitude: '-25.25', altitude: '-15.5' });
  assert.ok(Math.abs(Number(readEditableExif(located).latitude) - 42.5) < 0.00001);
  assert.ok(Math.abs(Number(readEditableExif(located).longitude) + 25.25) < 0.00001);
  assert.equal(readEditableExif(located).altitude, '-15.5');
  const privateCopy = writeEditableExif(located, readEditableExif(located), true);
  assert.equal(readEditableExif(privateCopy).latitude, '');
  assert.equal(readEditableExif(privateCopy).altitude, '');
  assert.throws(() => writeEditableExif(original, { ...fields, make: 'Камера' }), /ASCII/);
});
