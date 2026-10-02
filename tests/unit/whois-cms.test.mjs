import test from 'node:test';
import assert from 'node:assert/strict';
import { detectCms, adminPaths, classifyAdmin } from '../../src/modules/whois/cms.ts';
test('CMS detection exposes evidence and avoids plain-text brand mentions', () => {
    assert.deepEqual(detectCms('<p>We migrate WordPress websites</p>', {}), []);
    assert.equal(detectCms('<meta content="WordPress 6.8" name="generator">', {})[0].confidence, 'strong');
    assert.equal(detectCms('<script src="/wp-includes/js/a.js"></script>', {})[0].confidence, 'possible');
    assert.equal(detectCms('<main data-drupal-selector="page">', {})[0].name, 'Drupal');
    assert.deepEqual(adminPaths([{ name: 'WordPress', confidence: 'possible', evidence: [] }]), ['/wp-login.php', '/wp-admin/', '/admin/', '/login/']);
});
test('admin detection distinguishes soft 404s, blocked paths and login evidence', () => {
    assert.match(classifyAdmin(200, '<h1>Home</h1>', '/admin/', '<h1>Home</h1>'), /catch-all/);
    assert.match(classifyAdmin(403, '', '/admin/', ''), /unconfirmed/);
    assert.equal(classifyAdmin(404, '<input type="password">Login', '/admin/', ''), 'Not found');
    assert.match(classifyAdmin(200, '<form>Login<input type="password"></form>', '/wp-login.php', '<h1>Home</h1>'), /Login form detected/);
    assert.match(classifyAdmin(200, '<h1>Welcome</h1>', '/admin/', 'Home'), /unconfirmed/);
});
