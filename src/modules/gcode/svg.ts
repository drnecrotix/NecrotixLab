export type SvgOptions = { width: number; feed: number; plunge: number; safeZ: number; cutZ: number; spindle: number; step: number };
export function convertSvgToGCode(source: string, options: SvgOptions) {
    if (source.length > 2_000_000) throw new Error('SVG exceeds the 2 MB limit.');
    if (Object.values(options).some((value) => !Number.isFinite(value)) || options.width <= 0 || options.width > 1000 || options.step < .1 || options.step > 20 || options.feed <= 0 || options.plunge <= 0 || options.safeZ <= 0 || options.cutZ >= options.safeZ || options.spindle <= 0) throw new Error('Review width, feed, spindle and Z settings.');
    const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
    if (parsed.querySelector('parsererror') || parsed.documentElement.localName !== 'svg') throw new Error('Invalid SVG file.');
    if (parsed.querySelector('script,foreignObject,image,use,style,animate,animateTransform,filter,mask,clipPath')) throw new Error('SVG contains unsupported content. Remove it before conversion.');
    // Geometry APIs require a live SVG. Rebuild only supported nodes and numeric geometry attributes.
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const sourceSvg = parsed.documentElement;
    for (const name of ['viewBox', 'width', 'height']) { const value = sourceSvg.getAttribute(name); if (value) svg.setAttribute(name, value); }
    const allowed = new Set(['svg', 'g', 'path', 'line', 'polyline', 'polygon', 'rect', 'circle', 'ellipse']);
    const attrs = ['d', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'points', 'transform'];
    const copy = (node: Element, parent: Element) => { for (const child of [...node.children]) { if (!allowed.has(child.localName)) continue; const clean = document.createElementNS('http://www.w3.org/2000/svg', child.localName); for (const attr of attrs) { const value = child.getAttribute(attr); if (value && !/url\s*\(|javascript:|[<>]/i.test(value)) clean.setAttribute(attr, value); } parent.appendChild(clean); copy(child, clean); } };
    copy(sourceSvg, svg);
    const box = svg.viewBox.baseVal;
    const originalWidth = box?.width || parseFloat(svg.getAttribute('width') || '0');
    const left = box?.x || 0, top = box?.y || 0;
    if (!Number.isFinite(originalWidth) || originalWidth <= 0) throw new Error('SVG needs a numeric viewBox or width.');
    if (box?.width) { svg.setAttribute('width', String(box.width)); svg.setAttribute('height', String(box.height)); }
    const scale = options.width / originalWidth;
    const shapes = [...svg.querySelectorAll('path,line,polyline,polygon,rect,circle,ellipse')] as SVGGeometryElement[];
    if (!shapes.length || shapes.length > 500) throw new Error('Use an SVG with 1 to 500 vector shapes. Text must be converted to paths.');
    svg.style.position = 'absolute'; svg.style.visibility = 'hidden'; svg.style.pointerEvents = 'none';
    document.body.appendChild(svg);
    try {
    const f = (n: number) => n.toFixed(3).replace(/\.?0+$/, '');
    const code = ['(SVG toolpath - verify before machining)', 'G21 G90 G17 G94', `G0 Z${f(options.safeZ)}`, `M3 S${f(options.spindle)}`];
    let segments = 0;
    for (const shape of shapes) {
        const length = shape.getTotalLength();
        if (!Number.isFinite(length) || length <= 0) continue;
        const count = Math.max(1, Math.ceil(length * scale / options.step));
        segments += count;
        if (segments > 20000) throw new Error('Toolpath exceeds 20,000 segments. Increase sampling step.');
        const transform = shape.getCTM();
        if (!transform) throw new Error('Cannot resolve SVG geometry.');
        const point = (i: number) => {
            const p = shape.getPointAtLength(length * i / count).matrixTransform(transform);
            return { x: (p.x - left) * scale, y: (p.y - top) * -scale };
        };
        const first = point(0);
        code.push(`G0 Z${f(options.safeZ)}`, `G0 X${f(first.x)} Y${f(first.y)}`, `G1 Z${f(options.cutZ)} F${f(options.plunge)}`);
        for (let i = 1; i <= count; i++) { const p = point(i); code.push(`G1 X${f(p.x)} Y${f(p.y)} F${f(options.feed)}`); }
        code.push(`G0 Z${f(options.safeZ)}`);
    }
    if (!segments) throw new Error('No drawable paths were found.');
    code.push('M5', 'M30');
    return { code: code.join('\n'), shapes: shapes.length, segments };
    } finally { svg.remove(); }
}
