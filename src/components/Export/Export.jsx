/**
 * @file Export section: downloads the selected plots as GeoJSON.
 */
import { useState } from 'react';
import { exportPlots } from '../../services/exporter.js';
import './Export.css';

/**
 * Export component.
 *
 * @param {object} props
 * @param {import('../../models/Plot.js').Plot[]} props.plots - All plots; only the selected ones are exported.
 * @returns {JSX.Element}
 */
export default function Export({ plots }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const selected = plots.filter((p) => p.selected);
  const selectedWithErrors = selected.filter((p) => !p.isValid).length;

  /**
   * Runs the export and reports the outcome to the user.
   */
  async function handleExport() {
    setBusy(true);
    setMessage('');
    try {
      const fileName = await exportPlots(selected);
      setMessage(`Descarga generada: ${fileName}`);
    } catch (err) {
      setMessage(`Error al exportar: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="export">
      <button
        type="button"
        className="button button--primary"
        onClick={handleExport}
        disabled={busy || selected.length === 0}
      >
        {busy ? 'Generando…' : `Exportar ${selected.length} predio${selected.length === 1 ? '' : 's'} en GeoJSON`}
      </button>
      <p className="export__hint">
        Un predio se descarga como archivo <code>.geojson</code>; varios predios se descargan como una carpeta
        comprimida <code>.zip</code> con un <code>.geojson</code> por predio.
      </p>
      {selectedWithErrors > 0 && (
        <p className="export__warning">
          Atención: {selectedWithErrors} de los predios seleccionados tienen estado ERROR.
        </p>
      )}
      {message && <p className="export__message">{message}</p>}
    </div>
  );
}
