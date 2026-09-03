/**
 * @file Exports selected plots as GeoJSON files. A single plot downloads as
 * "<id>.geojson"; several plots are placed in a folder and zipped.
 */
import JSZip from 'jszip';

/** Folder name used inside the zip and as the zip base name. */
export const EXPORT_FOLDER = 'predios_geojson';

/**
 * Makes a string safe to use as a file name and guarantees it is not empty.
 *
 * @param {string} value - Raw identifier.
 * @param {string} fallback - Used when value is empty after sanitizing.
 * @returns {string} Safe file name without extension.
 */
export function sanitizeFileName(value, fallback) {
  const cleaned = String(value ?? '')
    .trim()
    .replace(/[\\/:*?"<>|\s]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned === '' ? fallback : cleaned;
}

/**
 * Assigns a unique "<id>.geojson" file name to every plot, adding _2, _3...
 * when identifiers repeat.
 *
 * @param {import('../models/Plot.js').Plot[]} plots
 * @returns {Array<{plot: import('../models/Plot.js').Plot, fileName: string}>}
 */
export function buildFileNames(plots) {
  const used = new Map();
  return plots.map((plot) => {
    const base = sanitizeFileName(plot.id, `predio_${plot.rowIndex}`);
    const count = (used.get(base) || 0) + 1;
    used.set(base, count);
    const name = count === 1 ? base : `${base}_${count}`;
    return { plot, fileName: `${name}.geojson` };
  });
}

/**
 * Triggers a browser download for a Blob.
 *
 * @param {Blob} blob - Content to download.
 * @param {string} fileName - Suggested file name.
 */
export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exports the given plots. One plot -> single .geojson; many -> zipped folder
 * with one .geojson per plot.
 *
 * @param {import('../models/Plot.js').Plot[]} plots - Plots to export (already filtered by selection).
 * @returns {Promise<string>} Name of the downloaded file.
 * @throws {Error} When no plots are given.
 */
export async function exportPlots(plots) {
  if (plots.length === 0) throw new Error('No hay predios seleccionados para exportar.');
  const entries = buildFileNames(plots);

  if (entries.length === 1) {
    const { plot, fileName } = entries[0];
    const blob = new Blob([JSON.stringify(plot.toGeoJSON(), null, 2)], { type: 'application/geo+json' });
    downloadBlob(blob, fileName);
    return fileName;
  }

  const zip = new JSZip();
  const folder = zip.folder(EXPORT_FOLDER);
  entries.forEach(({ plot, fileName }) => {
    folder.file(fileName, JSON.stringify(plot.toGeoJSON(), null, 2));
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  const zipName = `${EXPORT_FOLDER}.zip`;
  downloadBlob(blob, zipName);
  return zipName;
}
