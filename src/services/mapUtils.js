/**
 * @file Helpers shared by the Map component.
 */

/**
 * Returns plots whose geometry can be drawn (finite coordinates, at least 3 vertices).
 * Plots without a drawable geometry stay in the table but are not rendered.
 *
 * @param {import('../../models/Plot.js').Plot[]} plots
 * @returns {import('../../models/Plot.js').Plot[]}
 */
export function drawablePlots(plots) {
  return plots.filter((plot) => {
    const ring = plot.geometry?.coordinates?.[0];
    return Array.isArray(ring) && ring.length >= 3 && ring.every(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat));
  });
}
