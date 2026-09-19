import 'server-only';

import * as exifr from 'exifr';
import sharp, { type Metadata } from 'sharp';
import type { ExtractedMediaMetadata } from '@/lib/media-metadata-types';

const MAX_TEXT = 600;

function value(record: Record<string, unknown>, ...keys: string[]) {
    for (const key of keys) {
        const candidate = record[key];
        if (candidate !== undefined && candidate !== null && candidate !== '') return candidate;
    }
    return undefined;
}

function text(input: unknown, max = MAX_TEXT): string {
    if (Array.isArray(input)) return input.map((entry) => text(entry, max)).filter(Boolean).join(', ').slice(0, max);
    if (input instanceof Date) return input.toISOString();
    if (typeof input === 'number' && Number.isFinite(input)) return String(input);
    if (typeof input !== 'string') return '';
    return input.replace(/\0/g, '').trim().slice(0, max);
}

function number(input: unknown) {
    const result = typeof input === 'number' ? input : Number(input);
    return Number.isFinite(result) ? result : null;
}

function date(input: unknown) {
    if (!input) return '';
    const parsed = input instanceof Date ? input : new Date(String(input).replace(/^([0-9]{4}):([0-9]{2}):([0-9]{2})/, '$1-$2-$3'));
    return Number.isNaN(parsed.getTime()) ? text(input, 80) : parsed.toISOString().slice(0, 10);
}

function decimal(input: unknown, digits = 1) {
    const parsed = number(input);
    if (parsed === null) return '';
    return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(digits).replace(/\.0+$/, '');
}

function exposure(input: unknown) {
    const parsed = number(input);
    if (parsed === null || parsed <= 0) return text(input, 80);
    if (parsed < 1) return `1/${Math.max(1, Math.round(1 / parsed))} s`;
    return `${decimal(parsed, 2)} s`;
}

function keywordList(input: unknown): string[] {
    const values = Array.isArray(input) ? input : text(input).split(/[;,]/);
    return [...new Set(values.map((entry: unknown) => text(entry, 60).replace(/^#+/, '')).filter(Boolean))].slice(0, 30);
}

function location(record: Record<string, unknown>) {
    const parts = [
        value(record, 'Sub-location', 'Sublocation', 'Location'),
        value(record, 'City'),
        value(record, 'Province-State', 'State', 'Province'),
        value(record, 'Country-PrimaryLocationName', 'Country'),
    ].map((entry) => text(entry, 120)).filter(Boolean);
    return [...new Set(parts)].join(', ').slice(0, 240);
}

export async function extractMediaMetadata(buffer: Buffer): Promise<ExtractedMediaMetadata> {
    const [sharpResult, parsed] = await Promise.all([
        sharp(buffer, { failOn: 'none' }).metadata().catch(() => null),
        exifr.parse(buffer, {
            tiff: true,
            exif: true,
            gps: true,
            xmp: true,
            iptc: true,
            jfif: true,
            ihdr: true,
            icc: false,
            makerNote: false,
            userComment: true,
        }).catch(() => ({})),
    ]);
    const sharpMetadata: Partial<Metadata> = sharpResult || {};
    const tags = parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
    const orientation = number(value(tags, 'Orientation')) ?? sharpMetadata.orientation ?? null;
    const swapsDimensions = orientation !== null && [5, 6, 7, 8].includes(orientation);
    const rawWidth = number(value(tags, 'ExifImageWidth', 'ImageWidth', 'PixelXDimension')) ?? sharpMetadata.width ?? null;
    const rawHeight = number(value(tags, 'ExifImageHeight', 'ImageHeight', 'PixelYDimension')) ?? sharpMetadata.height ?? null;
    const width = swapsDimensions ? rawHeight : rawWidth;
    const height = swapsDimensions ? rawWidth : rawHeight;
    const make = text(value(tags, 'Make'), 120);
    const model = text(value(tags, 'Model', 'CameraModelName'), 160);
    const camera = model && make && !model.toLowerCase().includes(make.toLowerCase()) ? `${make} ${model}` : model || make;
    const latitude = number(value(tags, 'latitude', 'GPSLatitude'));
    const longitude = number(value(tags, 'longitude', 'GPSLongitude'));
    const hasGpsCoordinates = latitude !== null && longitude !== null;
    const sourceKinds: string[] = [
        Object.keys(tags).length ? 'EXIF/IPTC/XMP' : '',
        width && height ? 'image dimensions' : '',
    ].filter(Boolean);

    const result: ExtractedMediaMetadata = {
        width,
        height,
        title: text(value(tags, 'Title', 'ObjectName', 'Headline', 'DocumentName'), 160),
        description: text(value(tags, 'Description', 'Caption-Abstract', 'ImageDescription'), 1600),
        artist: text(value(tags, 'Artist', 'Creator', 'By-line', 'Author'), 160),
        copyrightHolder: text(value(tags, 'Copyright', 'CopyrightNotice', 'Rights'), 200),
        dateCreated: date(value(tags, 'DateTimeOriginal', 'CreateDate', 'DateCreated', 'ModifyDate')),
        camera,
        lens: text(value(tags, 'LensModel', 'Lens', 'LensInfo'), 240),
        focalLength: number(value(tags, 'FocalLength')) !== null ? `${decimal(value(tags, 'FocalLength'))} mm` : text(value(tags, 'FocalLengthIn35mmFormat'), 80),
        aperture: number(value(tags, 'FNumber', 'ApertureValue')) !== null ? `f/${decimal(value(tags, 'FNumber', 'ApertureValue'))}` : '',
        shutterSpeed: exposure(value(tags, 'ExposureTime')),
        iso: number(value(tags, 'ISO', 'ISOSpeedRatings', 'PhotographicSensitivity')) !== null ? `ISO ${decimal(value(tags, 'ISO', 'ISOSpeedRatings', 'PhotographicSensitivity'), 0)}` : '',
        software: text(value(tags, 'Software', 'CreatorTool'), 240),
        location: location(tags),
        resolution: width && height ? `${width} × ${height} px${sharpMetadata.density ? ` · ${sharpMetadata.density} DPI` : ''}` : '',
        keywords: keywordList(value(tags, 'Keywords', 'Subject', 'XPKeywords', 'HierarchicalSubject')),
        orientation,
        hasGpsCoordinates,
        sourceKinds,
        fieldCount: 0,
    };
    result.fieldCount = Object.entries(result).filter(([key, entry]) => !['fieldCount', 'sourceKinds', 'hasGpsCoordinates', 'orientation', 'width', 'height'].includes(key) && (Array.isArray(entry) ? entry.length : Boolean(entry))).length;
    return result;
}
