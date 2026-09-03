/**
 * @file Plots section: table listing every plot with its selection check,
 * identifier, validation status and failed validations.
 */
import { PlotStatus } from '../../models/Plot.js';
import './Plots.css';

/**
 * Plots component.
 *
 * @param {object} props
 * @param {import('../../models/Plot.js').Plot[]} props.plots - Validated plots to list.
 * @param {(key: string, selected: boolean) => void} props.onToggle - Toggles one plot's check.
 * @param {(selected: boolean) => void} props.onToggleAll - Checks / unchecks every plot.
 * @param {(key: string, visible: boolean) => void} props.onToggleVisible - Shows / hides one plot on the map.
 * @param {(visible: boolean) => void} props.onToggleAllVisible - Shows / hides every plot on the map.
 * @param {string|null} props.highlightedKey - Key of the plot currently highlighted (hovered / clicked on map).
 * @param {(key: string|null) => void} props.onHighlight - Reports the plot the user is pointing at.
 * @returns {JSX.Element}
 */
export default function Plots({
  plots,
  onToggle,
  onToggleAll,
  onToggleVisible,
  onToggleAllVisible,
  highlightedKey,
  onHighlight,
}) {
  const total = plots.length;
  const okCount = plots.filter((p) => p.status === PlotStatus.OK).length;
  const selectedCount = plots.filter((p) => p.selected).length;
  const allSelected = total > 0 && selectedCount === total;
  const visibleCount = plots.filter((p) => p.visible).length;
  const allVisible = total > 0 && visibleCount === total;

  if (total === 0) {
    return <p className="plots__empty">Cargue un archivo y procese los predios para ver el listado.</p>;
  }

  return (
    <div className="plots">
      <p className="plots__summary">
        {total} predios · <span className="plots__ok">{okCount} OK</span> ·{' '}
        <span className="plots__error">{total - okCount} ERROR</span> · {selectedCount} seleccionados
      </p>
      <div className="plots__table-wrapper">
        <table className="plots__table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  title="Seleccionar todos"
                  checked={allSelected}
                  onChange={(e) => onToggleAll(e.target.checked)}
                />
              </th>
              <th className="plots__visibility-header">
                <label className="plots__switch" title="Mostrar u ocultar todos en el mapa">
                  <input type="checkbox" checked={allVisible} onChange={(e) => onToggleAllVisible(e.target.checked)} />
                  <span className="plots__switch-track" />
                </label>
                <span className="plots__visibility-label">Mapa</span>
              </th>
              <th>ID</th>
              <th>Estado</th>
              <th>Errores</th>
            </tr>
          </thead>
          <tbody>
            {plots.map((plot) => (
              <tr
                key={plot.key}
                className={[
                  `plots__row plots__row--${plot.status.toLowerCase()}`,
                  plot.key === highlightedKey ? 'plots__row--highlight' : '',
                ].join(' ')}
                onMouseEnter={() => onHighlight(plot.key)}
                onMouseLeave={() => onHighlight(null)}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={plot.selected}
                    onChange={(e) => onToggle(plot.key, e.target.checked)}
                  />
                </td>
                <td>
                  <label
                    className="plots__switch"
                    title={plot.visible ? 'Ocultar en el mapa' : 'Mostrar en el mapa'}
                  >
                    <input
                      type="checkbox"
                      checked={plot.visible}
                      onChange={(e) => onToggleVisible(plot.key, e.target.checked)}
                    />
                    <span className="plots__switch-track" />
                  </label>
                </td>
                <td>{plot.id === '' ? <em>(fila {plot.rowIndex})</em> : plot.id}</td>
                <td>
                  <span className={`plots__badge plots__badge--${plot.status.toLowerCase()}`}>{plot.status}</span>
                </td>
                <td>
                  {plot.errors.length > 0 && (
                    <ul className="plots__errors">
                      {plot.errors.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
