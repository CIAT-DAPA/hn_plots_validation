/**
 * @file Input section: Excel upload plus geometry / identifier field selection.
 */
import { useState } from 'react';
import { readExcelFile } from '../../services/excelReader.js';
import { detectSpatialFields, suggestIdFields } from '../../services/spatialFields.js';
import './Input.css';

/** Spanish labels for each spatial kind shown in the geometry selector. */
const KIND_LABELS = {
  polygon: 'polígono',
  point: 'punto',
  latitude: 'latitud',
  longitude: 'longitud',
};

/**
 * Input component. Lets the user pick an Excel file, shows the detected
 * spatial fields and asks which one builds the polygons and which column is
 * the identifier. Calls onProcess with the chosen configuration.
 *
 * @param {object} props
 * @param {(config: {rows: object[], geometryField: string, idField: string, fileName: string}) => void} props.onProcess
 *   Invoked when the user confirms the field selection.
 * @param {() => void} props.onReset - Invoked when a new file is chosen so parent state can be cleared.
 * @returns {JSX.Element}
 */
export default function Input({ onProcess, onReset }) {
  const [fileName, setFileName] = useState('');
  const [sheet, setSheet] = useState(null);
  const [spatialFields, setSpatialFields] = useState([]);
  const [geometryField, setGeometryField] = useState('');
  const [idField, setIdField] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Handles the file input change: reads the workbook and detects fields.
   * @param {React.ChangeEvent<HTMLInputElement>} event
   */
  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setLoading(true);
    onReset();
    try {
      const data = await readExcelFile(file);
      const fields = detectSpatialFields(data.headers, data.rows);
      const polygonFields = fields.filter((f) => f.polygonCapable);
      const idCandidates = suggestIdFields(data.headers, data.rows);
      setFileName(file.name);
      setSheet(data);
      setSpatialFields(fields);
      setGeometryField(polygonFields[0]?.name ?? '');
      setIdField(idCandidates[0] ?? data.headers[0] ?? '');
      if (fields.length === 0) {
        setError('No se detectaron campos con información espacial en el archivo.');
      }
    } catch (err) {
      setSheet(null);
      setSpatialFields([]);
      setError(`No fue posible leer el archivo: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Sends the selected configuration to the parent.
   * @param {React.FormEvent<HTMLFormElement>} event
   */
  function handleSubmit(event) {
    event.preventDefault();
    if (!sheet || !geometryField || !idField) return;
    onProcess({ rows: sheet.rows, geometryField, idField, fileName });
  }

  const polygonFields = spatialFields.filter((f) => f.polygonCapable);

  return (
    <form className="input" onSubmit={handleSubmit}>
      <label className="input__file">
        <span className="input__file-label">Archivo Excel (.xlsx, .xls)</span>
        <input type="file" accept=".xlsx,.xls,.xlsm" onChange={handleFileChange} disabled={loading} />
      </label>
      {loading && <p className="input__hint">Leyendo archivo…</p>}
      {error && <p className="input__error">{error}</p>}

      {sheet && (
        <div className="input__summary">
          <p>
            <strong>{fileName}</strong> — hoja «{sheet.sheetName}», {sheet.rows.length} registros,{' '}
            {sheet.headers.length} columnas.
          </p>
          <p className="input__hint">Campos con información espacial detectados:</p>
          <ul className="input__fields">
            {spatialFields.map((field) => (
              <li key={field.name}>
                <code>{field.name}</code> <span className="input__kind">{KIND_LABELS[field.kind]}</span>
                {field.samples > 0 && <span className="input__hint"> ({field.samples} valores)</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {sheet && polygonFields.length > 0 && (
        <div className="input__selectors">
          <label>
            Campo para construir los polígonos
            <select value={geometryField} onChange={(e) => setGeometryField(e.target.value)}>
              {polygonFields.map((field) => (
                <option key={field.name} value={field.name}>
                  {field.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Campo identificador del polígono
            <select value={idField} onChange={(e) => setIdField(e.target.value)}>
              {sheet.headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="button button--primary">
            Procesar predios
          </button>
        </div>
      )}
      {sheet && polygonFields.length === 0 && !error && (
        <p className="input__error">Ningún campo detectado permite construir polígonos.</p>
      )}
    </form>
  );
}
