/**
 * @file Builds GeoJSON Polygon geometries from the spatial cell formats
 * recognised by spatialFields.js and assembles Plot entities.
 */
import { Plot } from '../models/Plot.js';
import { splitVertices } from './spatialFields.js';

/**
 * Parses one ODK vertex ("lat lon [alt] [acc]") or a "lat,lon" pair into a
 * GeoJSON position [lon, lat]. Non-numeric parts yield NaN so the validator
 * can report them instead of silently dropping the vertex.
 *
 * @param {string} vertex - Text of one vertex.
 * @returns {number[]} [longitude, latitude].
 */
export function parseVertex(vertex) {
  const parts = vertex.includes(',') ? vertex.split(',') : vertex.split(/\s+/);
  const lat = parseFloat(parts[0]);
  const lon = parseFloat(parts[1]);
  return [lon, lat];
}

/**
 * Parses a WKT POLYGON / MULTIPOLYGON (first polygon only) into rings.
 * WKT stores coordinates as "lon lat".
 *
 * @param {string} text - WKT string.
 * @returns {number[][][]} Array of rings, each an array of [lon, lat].
 */
export function parseWktPolygon(text) {
  const body = text.replace(/^\s*(MULTI)?POLYGON\s*/i, '');
  const ringMatches = body.match(/\(([^()]+)\)/g) || [];
  return ringMatches.map((ring) =>
    ring
      .replace(/[()]/g, '')
      .split(',')
      .map((pair) => pair.trim().split(/\s+/).map(parseFloat))
      .map(([lon, lat]) => [lon, lat]),
  );
}

/**
 * Converts the content of a spatial cell into a GeoJSON Polygon geometry.
 * The ring is returned exactly as captured (not auto-closed) so the validator
 * can flag open polygons.
 *
 * @param {any} value - Cell content.
 * @returns {object|null} GeoJSON Polygon or null when the cell is empty.
 */
export function buildPolygonGeometry(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (text === '') return null;
  let rings;
  if (/^\s*(MULTI)?POLYGON\s*\(/i.test(text)) {
    rings = parseWktPolygon(text);
  } else {
    rings = [splitVertices(text).map(parseVertex)];
  }
  if (rings.length === 0 || rings[0].length === 0) return null;
  return { type: 'Polygon', coordinates: rings };
}

/**
 * Builds a Plot for every row using the geometry and id fields chosen by the user.
 * All remaining columns become properties. Validation is not performed here.
 *
 * @param {Array<Object<string, any>>} rows - Data rows from the Excel sheet.
 * @param {string} geometryField - Column that holds the polygon.
 * @param {string} idField - Column that identifies the plot.
 * @returns {Plot[]} One plot per row, in sheet order.
 */
export function buildPlots(rows, geometryField, idField) {
  return rows.map((row, index) => {
    const { [geometryField]: rawGeometry, ...properties } = row;
    const rawId = row[idField];
    const id = rawId === null || rawId === undefined ? '' : String(rawId).trim();
    return new Plot({
      id,
      rowIndex: index + 1,
      geometry: buildPolygonGeometry(rawGeometry),
      properties,
    });
  });
}
