import sanitizeHtml from 'sanitize-html';

// SVG uploads remain vectors, but may not execute code or load external resources.
export function sanitizeSvg(source: string): string {
    if (source.length > 2 * 1024 * 1024 || /<!DOCTYPE|<!ENTITY/i.test(source)) {
        throw new Error('SVG must be under 2 MB and must not contain document entities.');
    }
    const clean = sanitizeHtml(source, {
        parser: { lowerCaseTags: false, lowerCaseAttributeNames: false },
        allowedTags: ['svg', 'g', 'defs', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask', 'use', 'title', 'desc'],
        allowedAttributes: { '*': ['xmlns', 'viewBox', 'width', 'height', 'id', 'd', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'fx', 'fy', 'points', 'transform', 'fill', 'fill-rule', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-opacity', 'stroke-dasharray', 'opacity', 'offset', 'stop-color', 'stop-opacity', 'gradientUnits', 'gradientTransform', 'spreadMethod', 'clip-path', 'clip-rule', 'mask', 'maskUnits', 'href', 'preserveAspectRatio'] },
        allowedSchemes: [],
        allowProtocolRelative: false,
        nonTextTags: ['script', 'style', 'textarea', 'foreignObject'],
        transformTags: {
            '*': (tagName, attribs) => {
                // Preserve common vector-editor exports without allowing arbitrary CSS.
                for (const declaration of (attribs.style || '').split(';')) {
                    const colon = declaration.indexOf(':');
                    if (colon < 0) continue;
                    const key = declaration.slice(0, colon).trim();
                    if (['fill', 'fill-rule', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-opacity', 'opacity', 'stop-color', 'stop-opacity'].includes(key)) {
                        attribs[key] = declaration.slice(colon + 1).trim();
                    }
                }
                delete attribs.style;
                for (const [key, value] of Object.entries(attribs)) {
                    if ((key === 'href' && !/^#[\w.-]+$/.test(value)) ||
                        (/url\s*\(/i.test(value) && !/^url\(#[\w.-]+\)$/.test(value)) ||
                        /[\\\u0000-\u001f]/.test(value)) delete attribs[key];
                }
                return { tagName, attribs };
            },
        },
    }).trim();
    if (!/^<svg(?:\s|>)/.test(clean) || !/<\/svg>$/.test(clean)) throw new Error('Invalid SVG image.');
    return clean;
}
