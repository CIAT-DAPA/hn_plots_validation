/**
 * @file Reads an Excel workbook in the browser and returns headers and rows.
 */
import * as XLSX from 'xlsx';

/**
 * Result of reading a sheet.
 * @typedef {object} SheetData
 * @property {string} sheetName - Name of the sheet that was read.
 * @property {string[]} headers - Column headers, in sheet order. Empty headers are replaced by "Columna_N".
 * @property {Array<Object<string, any>>} rows - One object per data row keyed by header. Empty rows are skipped.
 */

/**
 * Reads the first sheet of an Excel file selected by the user.
 *
 * @param {File} file - File object from an <input type="file">.
 * @returns {Promise<SheetData>} Parsed headers and rows.
 * @throws {Error} When the workbook has no sheets or the sheet is empty.
 */
export async function readExcelFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('El archivo no contiene hojas.');
  }
  const sheet = workbook.Sheets[sheetName];
  return parseSheet(sheet, sheetName);
}

/**
 * Converts a SheetJS worksheet into headers and row objects.
 *
 * @param {XLSX.WorkSheet} sheet - Worksheet to parse.
 * @param {string} sheetName - Sheet name, echoed in the result.
 * @returns {SheetData}
 * @throws {Error} When the sheet has no header row.
 */
export function parseSheet(sheet, sheetName) {
  // header: 1 -> array of arrays, keeps every column even when the header is empty.
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false });
  if (matrix.length === 0) {
    throw new Error('La hoja está vacía.');
  }
  const headers = normalizeHeaders(matrix[0]);
  const rows = matrix
    .slice(1)
    .filter((cells) => cells.some((value) => value !== null && value !== ''))
    .map((cells) => {
      const row = {};
      headers.forEach((header, index) => {
        const value = cells[index];
        row[header] = value === undefined ? null : value;
      });
      return row;
    });
  return { sheetName, headers, rows };
}

/**
 * Trims header names, fills empty ones and de-duplicates repeated names by
 * appending a numeric suffix (the sample file repeats "Años" three times).
 *
 * @param {any[]} rawHeaders - First row of the sheet.
 * @returns {string[]} Unique, non-empty header names.
 */
export function normalizeHeaders(rawHeaders) {
  const seen = new Map();
  return rawHeaders.map((raw, index) => {
    let name = raw === null || raw === undefined ? '' : String(raw).trim();
    if (name === '') name = `Columna_${index + 1}`;
    const count = seen.get(name) || 0;
    seen.set(name, count + 1);
    return count === 0 ? name : `${name}_${count + 1}`;
  });
}
