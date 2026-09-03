/**
 * @file Detects which Excel columns contain spatial information.
 *
 * Supported formats:
 *  - ODK / KoboToolbox "geoshape" or "geotrace": "lat lon alt acc;lat lon alt acc;..."
 *  - ODK "geopoint": "lat lon alt acc"
 *  - WKT: "POLYGON((lon lat, lon lat, ...))"
 *  - Coordinate pairs separated by ";" or "|": "lat,lon;lat,lon;..."
 *  - Single numeric latitude / longitude columns (detected by header name).
 */

/** Kinds of spatial content a column can hold. */
export const SpatialKind = Object.freeze({
  POLYGON: 'polygon',
  POINT: 'point',
  LATITUDE: 'latitude',
  LONGITUDE: 'longitude',
});

/**
 * Description of a spatial column.
 * @typedef {object} SpatialField
 * @property {string} name - Column header.
 * @property {string} kind - One of SpatialKind.
 * @property {number} samples - Number of non-empty cells that matched the kind.
 * @property {boolean} polygonCapable - True when the column can be used to build polygons.
 */

const ODK_VERTEX = /^-?\d+(\.\d+)?\s+-?\d+(\.\d+)?(\s+-?\d+(\.\d+)?){0,2}$/;
const PAIR_VERTEX = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;
const WKT_POLYGON = /^\s*(MULTI)?POLYGON\s*\(/i;
const LAT_HEADER = /(^|[^a-z])(lat|latitud|latitude)([^a-z]|$)/i;
const LON_HEADER = /(^|[^a-z])(lon|lng|long|longitud|longitude)([^a-z]|$)/i;

/**
 * Splits a cell into candidate vertex strings using the ODK separators.
 *
 * @param {string} text - Raw cell content.
 * @returns {string[]} Trimmed, non-empty vertex strings.
 */
export function splitVertices(text) {
  return String(text)
    .split(/[;|\n]/)
    .map((part) => part.trim())
    .filter((part) => part !== '');
}

/**
 * Classifies a single cell value.
 *
 * @param {any} value - Cell content.
 * @returns {string|null} SpatialKind.POLYGON / POINT or null when not spatial.
 */
export function classifyCell(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (text === '') return null;
  if (WKT_POLYGON.test(text)) return SpatialKind.POLYGON;
  const vertices = splitVertices(text);
  if (vertices.length === 0) return null;
  const allVertices = vertices.every((v) => ODK_VERTEX.test(v) || PAIR_VERTEX.test(v));
  if (!allVertices) return null;
  return vertices.length >= 3 ? SpatialKind.POLYGON : SpatialKind.POINT;
}

/**
 * Scans every column and returns the ones holding spatial data, polygon
 * columns first, then points, then lat/lon numeric columns.
 *
 * @param {string[]} headers - Column names.
 * @param {Array<Object<string, any>>} rows - Data rows.
 * @returns {SpatialField[]} Detected spatial fields ordered by usefulness.
 */
export function detectSpatialFields(headers, rows) {
  const fields = [];
  for (const header of headers) {
    const counts = { [SpatialKind.POLYGON]: 0, [SpatialKind.POINT]: 0 };
    let nonEmpty = 0;
    let numeric = 0;
    for (const row of rows) {
      const value = row[header];
      if (value === null || value === undefined || String(value).trim() === '') continue;
      nonEmpty += 1;
      const kind = classifyCell(value);
      if (kind) counts[kind] += 1;
      if (!Number.isNaN(Number(value))) numeric += 1;
    }
    if (counts[SpatialKind.POLYGON] > 0) {
      fields.push({ name: header, kind: SpatialKind.POLYGON, samples: counts[SpatialKind.POLYGON], polygonCapable: true });
    } else if (counts[SpatialKind.POINT] > 0) {
      fields.push({ name: header, kind: SpatialKind.POINT, samples: counts[SpatialKind.POINT], polygonCapable: false });
    } else if (LAT_HEADER.test(header) && (nonEmpty === 0 || numeric === nonEmpty)) {
      fields.push({ name: header, kind: SpatialKind.LATITUDE, samples: numeric, polygonCapable: false });
    } else if (LON_HEADER.test(header) && (nonEmpty === 0 || numeric === nonEmpty)) {
      fields.push({ name: header, kind: SpatialKind.LONGITUDE, samples: numeric, polygonCapable: false });
    }
  }
  const order = [SpatialKind.POLYGON, SpatialKind.POINT, SpatialKind.LATITUDE, SpatialKind.LONGITUDE];
  return fields.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || b.samples - a.samples);
}

/**
 * Suggests columns that look like identifiers (header contains id/clave/código,
 * or values are unique across rows). Used to preselect the id field.
 *
 * @param {string[]} headers - Column names.
 * @param {Array<Object<string, any>>} rows - Data rows.
 * @returns {string[]} Header names ordered by likelihood of being an identifier.
 */
export function suggestIdFields(headers, rows) {
  const ID_HEADER = /(^|[^a-z])(id|clave|c[oó]digo|identidad|identificador|key|code)([^a-z]|$)/i;
  return headers
    .map((header) => {
      const values = rows.map((r) => r[header]).filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
      const unique = new Set(values.map(String)).size;
      const complete = rows.length > 0 && values.length === rows.length;
      const isUnique = complete && unique === values.length;
      const score = (ID_HEADER.test(header) ? 2 : 0) + (isUnique ? 1 : 0);
      return { header, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.header);
}
