const FORMULA_PREFIX = /^[\t\r ]*[=+\-@]/;

export function csvCell(value: unknown) {
    let text = value === null || value === undefined ? '' : String(value);
    if (FORMULA_PREFIX.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
}

export function csvDocument(rows: unknown[][]) {
    return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}
