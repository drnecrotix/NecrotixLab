import assert from 'node:assert/strict';
import test from 'node:test';

import { csvCell, csvDocument } from '../../src/lib/csv.ts';

test('CSV export escapes quotes and spreadsheet formulas', () => {
    assert.equal(csvCell('A "quoted" value'), '"A ""quoted"" value"');
    assert.equal(csvCell('=HYPERLINK("https://example.com")'), '"\'=HYPERLINK(""https://example.com"")"');
});

test('CSV export includes a UTF-8 BOM and CRLF rows', () => {
    assert.equal(csvDocument([['name'], ['Nikola']]), '\uFEFF"name"\r\n"Nikola"\r\n');
});
