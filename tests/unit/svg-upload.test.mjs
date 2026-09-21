import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { sanitizeSvg } from '../../src/lib/sanitize-svg.ts';

test('SVG retains vector geometry and gradients and renders as a PWA PNG', async () => {
  const svg = sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="a"><stop offset="0" stop-color="#f0f"/></linearGradient></defs><rect width="100" height="100" fill="url(#a)"/></svg>');
  assert.match(svg, /viewBox/);
  assert.match(svg, /linearGradient/);
  const png = await sharp(Buffer.from(svg)).resize(192, 192).png().toBuffer();
  assert.equal((await sharp(png).metadata()).width, 192);
});

test('SVG removes executable and external content', () => {
  const clean = sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script><foreignObject><iframe src="https://evil.test"/></foreignObject><use href="https://evil.test/a.svg#x"/><path d="M0 0" fill="url(https://evil.test)" style="background:url(https://evil.test)"/><use href="&#106;avascript:alert(1)"/></svg>');
  assert.doesNotMatch(clean, /onload|script|foreignObject|iframe|evil|javascript|style=/i);
});

test('SVG rejects entity declarations and non-SVG files', () => {
  assert.throws(() => sanitizeSvg('<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg>&x;</svg>'));
  assert.throws(() => sanitizeSvg('<html>not SVG</html>'));
});
