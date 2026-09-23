import piexif from 'piexifjs';

export type EditableExif = { description: string; documentName: string; make: string; model: string; software: string; artist: string; copyright: string; dateTime: string; dateTimeOriginal: string; dateTimeDigitized: string; cameraOwner: string; bodySerial: string; lensMake: string; lensModel: string; lensSerial: string; latitude: string; longitude: string; altitude: string };
const definitions = [
    ['description', '0th', piexif.ImageIFD.ImageDescription],
    ['documentName', '0th', piexif.ImageIFD.DocumentName],
    ['make', '0th', piexif.ImageIFD.Make],
    ['model', '0th', piexif.ImageIFD.Model],
    ['software', '0th', piexif.ImageIFD.Software],
    ['artist', '0th', piexif.ImageIFD.Artist],
    ['copyright', '0th', piexif.ImageIFD.Copyright],
    ['dateTime', '0th', piexif.ImageIFD.DateTime],
    ['dateTimeOriginal', 'Exif', piexif.ExifIFD.DateTimeOriginal],
    ['dateTimeDigitized', 'Exif', piexif.ExifIFD.DateTimeDigitized],
    ['cameraOwner', 'Exif', piexif.ExifIFD.CameraOwnerName],
    ['bodySerial', 'Exif', piexif.ExifIFD.BodySerialNumber],
    ['lensMake', 'Exif', piexif.ExifIFD.LensMake],
    ['lensModel', 'Exif', piexif.ExifIFD.LensModel],
    ['lensSerial', 'Exif', piexif.ExifIFD.LensSerialNumber],
] as const;
function rational(value: unknown) { return Array.isArray(value) && Number(value[1]) ? Number(value[0]) / Number(value[1]) : NaN; }
function coordinate(value: unknown, ref: unknown) {
    if (!Array.isArray(value) || value.length !== 3) return '';
    const parts = value.map((item) => Array.isArray(item) && Number(item[1]) ? Number(item[0]) / Number(item[1]) : NaN);
    if (parts.some((item) => !Number.isFinite(item))) return '';
    const decimal = parts[0] + parts[1] / 60 + parts[2] / 3600;
    return String(['S', 'W'].includes(String(ref)) ? -decimal : decimal);
}
function dms(value: number): number[][] {
    const absolute = Math.abs(value), degrees = Math.floor(absolute), minutes = Math.floor((absolute - degrees) * 60);
    const seconds = (absolute - degrees - minutes / 60) * 3600;
    return [[degrees, 1], [minutes, 1], [Math.round(seconds * 1_000_000), 1_000_000]];
}

export function readEditableExif(dataUrl: string): EditableExif {
    const exif = piexif.load(dataUrl);
    const altitude = rational(exif.GPS?.[piexif.GPSIFD.GPSAltitude]);
    return { ...Object.fromEntries(definitions.map(([name, group, tag]) => [name, String(exif[group]?.[tag] ?? '').replace(/\0/g, '')])),
        latitude: coordinate(exif.GPS?.[piexif.GPSIFD.GPSLatitude], exif.GPS?.[piexif.GPSIFD.GPSLatitudeRef]),
        longitude: coordinate(exif.GPS?.[piexif.GPSIFD.GPSLongitude], exif.GPS?.[piexif.GPSIFD.GPSLongitudeRef]),
        altitude: Number.isFinite(altitude) ? String(exif.GPS?.[piexif.GPSIFD.GPSAltitudeRef] === 1 ? -altitude : altitude) : '' } as EditableExif;
}

export function writeEditableExif(dataUrl: string, fields: EditableExif, removeGps = false): string {
    if (!dataUrl.startsWith('data:image/jpeg;base64,')) throw new Error('EXIF editing requires a JPEG image.');
    const exif = piexif.load(dataUrl);
    exif['0th'] ||= {}; exif.Exif ||= {};
    for (const [name, group, tag] of definitions) {
        const value = fields[name].trim();
        if (value.length > 200 || /[^\x20-\x7e]/.test(value)) throw new Error('JPEG EXIF text must use printable ASCII and be at most 200 characters.');
        if (name === 'dateTime' || name === 'dateTimeOriginal' || name === 'dateTimeDigitized') {
            if (value && !/^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) throw new Error('Use YYYY:MM:DD HH:MM:SS for EXIF dates.');
        }
        if (value) exif[group]![tag] = value;
        else delete exif[group]![tag];
    }
    if (removeGps) exif.GPS = {};
    else {
        const lat = fields.latitude.trim(), lon = fields.longitude.trim(), altitudeText = fields.altitude.trim();
        if (Boolean(lat) !== Boolean(lon)) throw new Error('Enter both latitude and longitude, or leave both empty.');
        exif.GPS ||= {};
        if (altitudeText) {
            const altitude = Number(altitudeText);
            if (!Number.isFinite(altitude) || Math.abs(altitude) > 100000) throw new Error('Enter a valid GPS altitude in metres.');
            exif.GPS[piexif.GPSIFD.GPSAltitudeRef] = altitude < 0 ? 1 : 0;
            exif.GPS[piexif.GPSIFD.GPSAltitude] = [Math.round(Math.abs(altitude) * 100), 100];
        } else { delete exif.GPS[piexif.GPSIFD.GPSAltitudeRef]; delete exif.GPS[piexif.GPSIFD.GPSAltitude]; }
        if (lat) {
            const latitude = Number(lat), longitude = Number(lon);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new Error('Enter valid decimal GPS coordinates.');
            exif.GPS[piexif.GPSIFD.GPSLatitudeRef] = latitude < 0 ? 'S' : 'N';
            exif.GPS[piexif.GPSIFD.GPSLatitude] = dms(latitude);
            exif.GPS[piexif.GPSIFD.GPSLongitudeRef] = longitude < 0 ? 'W' : 'E';
            exif.GPS[piexif.GPSIFD.GPSLongitude] = dms(longitude);
        } else for (const tag of [piexif.GPSIFD.GPSLatitudeRef, piexif.GPSIFD.GPSLatitude, piexif.GPSIFD.GPSLongitudeRef, piexif.GPSIFD.GPSLongitude]) delete exif.GPS[tag];
    }
    return piexif.insert(piexif.dump(exif), dataUrl);
}
