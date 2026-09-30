import { expect, test, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

// CI explicitly installs Tools for visual coverage. The production default stays uninstalled.
if (process.env.CI) test.beforeAll(async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.page.upsert({
      where: { slug: '__service-tools-config' },
      create: { slug: '__service-tools-config', title: 'CI Tools addon', status: 'DRAFT', content: { version: 8, installed: true, active: true, packageVersion: '1.3.72' } },
      update: { content: { version: 8, installed: true, active: true, packageVersion: '1.3.72' } },
    });
  } finally { await prisma.$disconnect(); }
});

const routes = [
  '/',
  '/projects',
  '/blog',
  '/gallery',
  '/journey',
  '/lab',
  '/wiki',
  '/wiki/articles',
  '/wiki/faq',
  '/resume',
  '/contact',
  '/store',
  '/services/pricing',
  '/services',
  '/services/website-inspector',
  '/services/website',
  '/services/support',
  '/tools/binary-converter',
  '/tools/base64',
  '/tools/file-hash',
  '/tools/hex-viewer',
  '/tools/document-inspector',
  '/tools/text-toolkit',
  '/tools/image-toolkit',
  '/tools/calculators',
  '/tools/unit-converter',
  '/tools/web-encoder',
  '/tools/json-toolkit',
  '/tools/url-toolkit',
  '/tools/uuid-generator',
  '/tools/password-generator',
  '/tools/color-converter',
  '/tools/subtitle-converter',
  '/tools/gcode-editor',
  '/tools/video-download',
  '/tools/svg-to-gcode',
  '/tools/dxf-inspector',
  '/tools/whois',
  '/seo-intelligence',
  '/legal',
  '/privacy',
  '/cookies',
  '/terms',
] as const;
const themes = ['dark', 'light'] as const;

async function gotoWithTheme(page: Page, route: string, theme: (typeof themes)[number]) {
  await page.addInitScript((selectedTheme) => {
    localStorage.setItem('portfolio-theme', selectedTheme);
    sessionStorage.setItem('portfolioLoaded', 'true');
  }, theme);

  // Do not wait for networkidle here. Some public pages intentionally perform
  // background/external requests after rendering, so network activity is not a
  // reliable readiness signal and can make the smoke suite time out on CI.
  return page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60_000 });
}

for (const theme of themes) {
  for (const route of routes) {
    test(`${route} renders without layout breakage in ${theme} mode`, async ({ page }, testInfo) => {
      const response = await gotoWithTheme(page, route, theme);
      expect(response?.status(), `${route} should return a successful response`).toBeLessThan(400);
      await expect(page.locator('body')).toBeVisible();

      const csp = (await response?.headerValue('content-security-policy')) ?? '';
      expect(csp, `${route} should return a Content-Security-Policy header`).not.toBe('');
      expect(csp, `${route} must permit WebAssembly after client-side navigation to The Lab`).toContain("'wasm-unsafe-eval'");

      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      }));

      // Public pages must never make the document horizontally scrollable.
      // Components that intentionally scroll sideways must own that overflow locally.
      expect(
        dimensions.scrollWidth,
        `${route} exceeds the ${testInfo.project.name} viewport by ${dimensions.scrollWidth - dimensions.clientWidth}px`,
      ).toBeLessThanOrEqual(dimensions.clientWidth + 2);
      expect(dimensions.scrollHeight).toBeGreaterThanOrEqual(Math.min(300, dimensions.clientHeight));

      if (route === '/') await expect(page.locator('h1').first()).toBeVisible();
      if (route === '/projects') {
        await expect(page.getByText(/Projects Archive/i).first()).toBeVisible();
        await expect(page.getByRole('region', { name: 'Projects list' })).toBeVisible();
      }
      if (route === '/blog') {
        await expect(page.getByRole('button', { name: /All Publications/i }).first()).toBeVisible();
        await expect(page.getByRole('searchbox', { name: 'SEARCH ARCHIVE' })).toBeVisible();
      }
      if (route === '/contact') await expect(page.getByRole('heading', { name: /contact|start a conversation|get in touch/i }).first()).toBeVisible();
      if (route === '/store') await expect(page.getByRole('searchbox', { name: 'Search the Store' })).toBeVisible();
      if (route === '/services/pricing') await expect(page.getByRole('heading', { name: 'Service pricing' })).toBeVisible();
      if (route === '/seo-intelligence') await expect(page.getByRole('heading', { name: 'SEO Intelligence' })).toBeVisible();

      await page.screenshot({
        path: testInfo.outputPath(`${theme}-${route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')}.png`),
        fullPage: true,
      });
    });
  }
}


test('G-code editor keeps code beside the preview and follows edited motion', async ({ page }, testInfo) => {
  await gotoWithTheme(page, '/tools/gcode-editor', 'dark');
  const editor = page.getByRole('textbox', { name: 'G-Code program', exact: true });
  const preview = page.getByRole('img', { name: 'G-code XY simulation' });
  await expect(editor).toBeVisible();
  const editorBox = await editor.boundingBox();
  const previewBox = await preview.boundingBox();
  expect(editorBox!.height).toBeGreaterThanOrEqual(240);
  if (testInfo.project.name === 'desktop-chromium') {
    expect(previewBox!.x).toBeGreaterThan(editorBox!.x + editorBox!.width);
    expect(previewBox!.y).toBeLessThan(editorBox!.y + editorBox!.height);
  }
  await editor.fill('G21 G90\nG0 X10 Y10\nG1 X20 Y10 F100\nG1 X20 Y20');
  await expect(page.getByText('2 program XY blocks')).toBeVisible();
  await expect(preview.locator('path')).toHaveCount(0);
  await page.getByLabel('Show planned path').check();
  await expect(preview.locator('path')).toHaveCount(2);
  await editor.fill('G0 Z5\nG1 Z-1 F100');
  await expect(preview.locator('path')).toHaveCount(0);
  const longCode = Array.from({ length: 100 }, (_, i) => `G1 X${i} F100`).join('\n');
  await editor.fill(longCode);
  await editor.press('Control+End');
  await expect(editor).toHaveValue(longCode);
  const scroll = await editor.evaluate(el => ({ top: el.scrollTop, height: el.scrollHeight, visible: el.clientHeight }));
  expect(scroll.height).toBeGreaterThan(scroll.visible);
  expect(scroll.top).toBeGreaterThan(0);
});
