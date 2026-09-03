/**
 * @file Spatial and attribute validations for Plot entities.
 * Every rule returns a Spanish message when it fails; messages are shown in the UI.
 */
import area from '@turf/area';
import kinks from '@turf/kinks';
import { polygon as turfPolygon } from '@turf/helpers';
import { Plot } from '../models/Plot.js';

/** Messages (Spanish, user facing) for each validation rule. */
export const ValidationMessages = Object.freeze({
  NO_GEOMETRY: 'Sin geometría',
  NOT_ENOUGH_VERTICES: 'Menos de 3 vértices distintos',
  INVALID_COORDINATES: 'Coordenadas no numéricas',
  OUT_OF_RANGE: 'Coordenadas fuera de rango (lat ±90, lon ±180)',
  NOT_CLOSED: 'Polígono no cerrado (primer y último vértice difieren)',
  DUPLICATE_VERTICES: 'Vértices consecutivos duplicados',
  SELF_INTERSECTION: 'El polígono se auto-intersecta',
  ZERO_AREA: 'Área nula o degenerada',
  MISSING_ID: 'Identificador vacío',
  DUPLICATE_ID: 'Identificador duplicado',
});

/**
 * Checks that two positions are identical.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {boolean}
 */
function samePosition(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

/**
 * Runs the geometry rules on a GeoJSON Polygon (outer ring only).
 *
 * @param {object|null} geometry - GeoJSON Polygon or null.
 * @returns {string[]} Failed validation messages (empty when valid).
 */
export function validateGeometry(geometry) {
  const errors = [];
  if (!geometry || !geometry.coordinates || geometry.coordinates.length === 0) {
    return [ValidationMessages.NO_GEOMETRY];
  }
  const ring = geometry.coordinates[0];

  const hasInvalidNumbers = ring.some(([lon, lat]) => !Number.isFinite(lon) || !Number.isFinite(lat));
  if (hasInvalidNumbers) {
    errors.push(ValidationMessages.INVALID_COORDINATES);
    // Subsequent geometric checks are meaningless with NaN values.
    return errors;
  }

  if (ring.some(([lon, lat]) => Math.abs(lat) > 90 || Math.abs(lon) > 180)) {
    errors.push(ValidationMessages.OUT_OF_RANGE);
  }

  const isClosed = ring.length >= 2 && samePosition(ring[0], ring[ring.length - 1]);
  if (!isClosed) errors.push(ValidationMessages.NOT_CLOSED);

  const distinct = new Set(ring.map((p) => `${p[0]},${p[1]}`)).size;
  if (distinct < 3) errors.push(ValidationMessages.NOT_ENOUGH_VERTICES);

  for (let i = 1; i < ring.length; i += 1) {
    if (samePosition(ring[i - 1], ring[i])) {
      errors.push(ValidationMessages.DUPLICATE_VERTICES);
      break;
    }
  }

  if (distinct >= 3) {
    // Close a working copy so turf can evaluate open rings too.
    const closedRing = isClosed ? ring : [...ring, ring[0]];
    try {
      const feature = turfPolygon([closedRing]);
      const selfIntersects = kinks(feature).features.length > 0;
      if (selfIntersects) errors.push(ValidationMessages.SELF_INTERSECTION);
      // Signed areas cancel out on self-intersecting rings, so only check area when the ring is simple.
      else if (!(area(feature) > 0)) errors.push(ValidationMessages.ZERO_AREA);
    } catch {
      errors.push(ValidationMessages.ZERO_AREA);
    }
  }
  return errors;
}

/**
 * Validates every plot (geometry + identifier rules) and returns new Plot
 * instances carrying the error list.
 *
 * @param {Plot[]} plots - Plots built by geometryBuilder.
 * @returns {Plot[]} Validated plots in the same order.
 */
export function validatePlots(plots) {
  const idCounts = new Map();
  plots.forEach((plot) => {
    if (plot.id !== '') idCounts.set(plot.id, (idCounts.get(plot.id) || 0) + 1);
  });
  return plots.map((plot) => {
    const errors = validateGeometry(plot.geometry);
    if (plot.id === '') errors.push(ValidationMessages.MISSING_ID);
    else if (idCounts.get(plot.id) > 1) errors.push(ValidationMessages.DUPLICATE_ID);
    return new Plot({ ...plot, errors, selected: errors.length === 0 });
  });
}
