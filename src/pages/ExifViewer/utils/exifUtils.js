/**
 * Simple EXIF Parser for JPEG files
 * Extracts basic metadata without external libraries
 */

const TAGS = {
  0x010F: 'make',
  0x0110: 'model',
  0x0112: 'orientation',
  0x011A: 'xResolution',
  0x011B: 'yResolution',
  0x0131: 'software',
  0x0132: 'modifyDate',
  0x829A: 'exposureTime',
  0x829D: 'fNumber',
  0x8827: 'iso',
  0x9003: 'dateTaken',
  0x920A: 'focalLength',
  0xA002: 'width',
  0xA003: 'height',
  0xA405: 'focalLengthIn35mmFilm',
  0x9209: 'flash',
  0x9204: 'exposureBias',
  0xA434: 'lensModel',
};

export async function extractExif(file) {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);

  if (view.getUint16(0) !== 0xFFD8) return null; // Not a JPEG

  let offset = 2;
  while (offset < view.byteLength) {
    if (view.getUint16(offset) === 0xFFE1) {
      return parseExifSegment(view, offset + 4);
    }
    offset += 2 + view.getUint16(offset + 2);
  }
  return null;
}

function parseExifSegment(view, offset) {
  // Check "Exif\0\0"
  if (view.getUint32(offset) !== 0x45786966) return null;
  
  offset += 6;
  const tiffOffset = offset;

  // TIFF Header
  const bigEndian = view.getUint16(offset) === 0x4D4D;
  const getUint16 = (off) => view.getUint16(off, !bigEndian);
  const getUint32 = (off) => view.getUint32(off, !bigEndian);

  if (getUint16(offset + 2) !== 0x002A) return null;

  const firstIFD = getUint32(offset + 4);
  return readIFD(view, tiffOffset, tiffOffset + firstIFD, bigEndian);
}

function readIFD(view, tiffOffset, offset, bigEndian, isGPS = false) {
  const entries = view.getUint16(offset, !bigEndian);
  const results = {};

  const GPSTAGS = {
    0x0001: 'latRef', 0x0002: 'lat', 0x0003: 'lngRef', 0x0004: 'lng'
  };

  for (let i = 0; i < entries; i++) {
    const entryOffset = offset + 2 + (i * 12);
    const tag = view.getUint16(entryOffset, !bigEndian);
    const type = view.getUint16(entryOffset + 2, !bigEndian);
    const count = view.getUint32(entryOffset + 4, !bigEndian);
    const valueOffset = entryOffset + 8;

    const tagName = isGPS ? GPSTAGS[tag] : TAGS[tag];
    if (tagName) {
      results[tagName] = readValue(view, tiffOffset, valueOffset, type, count, bigEndian);
    }

    // Special case for Exif SubIFD (0x8769)
    if (tag === 0x8769) {
      const subOffset = view.getUint32(valueOffset, !bigEndian);
      Object.assign(results, readIFD(view, tiffOffset, tiffOffset + subOffset, bigEndian));
    }
    // Special case for GPS IFD (0x8825)
    if (tag === 0x8825) {
      const gpsOffset = view.getUint32(valueOffset, !bigEndian);
      results.gps = readIFD(view, tiffOffset, tiffOffset + gpsOffset, bigEndian, true);
    }
  }
  return results;
}

function readValue(view, tiffOffset, offset, type, count, bigEndian) {
  const getUint16 = (off) => view.getUint16(off, !bigEndian);
  const getUint32 = (off) => view.getUint32(off, !bigEndian);

  if (count > 1 && type !== 2) {
    const results = [];
    const valOffset = count * getByteSize(type) > 4 ? tiffOffset + getUint32(offset) : offset;
    for (let i = 0; i < count; i++) {
      results.push(readSingleValue(view, tiffOffset, valOffset + (i * getByteSize(type)), type, bigEndian));
    }
    return results;
  }

  return readSingleValue(view, tiffOffset, offset, type, bigEndian, count);
}

function getByteSize(type) {
  switch (type) {
    case 1: case 2: case 7: return 1;
    case 3: return 2;
    case 4: case 9: return 4;
    case 5: case 10: return 8;
    default: return 1;
  }
}

function readSingleValue(view, tiffOffset, offset, type, bigEndian, count = 1) {
  const getUint16 = (off) => view.getUint16(off, !bigEndian);
  const getUint32 = (off) => view.getUint32(off, !bigEndian);

  switch (type) {
    case 2: // ASCII String
      const strOffset = count > 4 ? tiffOffset + getUint32(offset) : offset;
      return getString(view, strOffset, count);
    case 3: // Short
      return getUint16(offset);
    case 4: // Long
      return getUint32(offset);
    case 5: // Rational
      const ratOffset = tiffOffset + getUint32(offset);
      return getUint32(ratOffset) / getUint32(ratOffset + 4);
    default:
      return null;
  }
}

function getString(view, offset, length) {
  let str = '';
  for (let i = 0; i < length - 1; i++) {
    str += String.fromCharCode(view.getUint8(offset + i));
  }
  return str.trim();
}

function formatGPS(gps) {
  if (!gps || !gps.lat || !gps.lng) return '-';
  const dms = (arr) => {
    if (!Array.isArray(arr)) return arr;
    return `${Math.round(arr[0])}° ${Math.round(arr[1])}' ${arr[2].toFixed(1)}"`;
  };
  return `${dms(gps.lat)} ${gps.latRef}, ${dms(gps.lng)} ${gps.lngRef}`;
}

export function formatExifData(raw) {
  if (!raw) return { model: 'غير معروف', make: '-', iso: '-', aperture: '-', shutter: '-', focal: '-', date: '-', resolution: '-', software: '-', exposureBias: '-', lensModel: '-', gps: '-' };
  
  return {
    make: raw.make || '-',
    model: raw.model || 'غير معروف',
    iso: raw.iso || '-',
    aperture: raw.fNumber ? `f/${raw.fNumber.toFixed(1)}` : '-',
    shutter: raw.exposureTime ? (raw.exposureTime < 1 ? `1/${Math.round(1/raw.exposureTime)}s` : `${raw.exposureTime}s`) : '-',
    focal: raw.focalLength ? `${raw.focalLength}mm` : '-',
    date: raw.dateTaken || raw.modifyDate || '-',
    resolution: raw.width && raw.height ? `${raw.width} x ${raw.height}` : '-',
    software: raw.software || '-',
    exposureBias: raw.exposureBias ? `${raw.exposureBias.toFixed(2)} EV` : '-',
    lensModel: raw.lensModel || '-',
    gps: formatGPS(raw.gps)
  };
}
