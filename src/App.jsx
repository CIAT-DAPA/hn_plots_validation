/**
 * @file Root component. Owns the shared list of Plot entities and lays out the
 * four vertical sections: header, data input, validation (table | map) and export.
 */
import { useCallback, useState } from 'react';
import Input from './components/Input/Input.jsx';
import Plots from './components/Plots/Plots.jsx';
import Map from './components/Map/Map.jsx';
import Export from './components/Export/Export.jsx';
import { buildPlots } from './services/geometryBuilder.js';
import { validatePlots } from './services/validator.js';
import './App.css';

/** Application title shown in the header. */
export const APP_TITLE = 'Validación y exportación de predios';

/**
 * App component.
 * @returns {JSX.Element}
 */
export default function App() {
  const [plots, setPlots] = useState([]);
  const [highlightedKey, setHighlightedKey] = useState(null);

  /**
   * Builds and validates plots from the configuration chosen in the Input section.
   * @param {{rows: object[], geometryField: string, idField: string}} config
   */
  const handleProcess = useCallback(({ rows, geometryField, idField }) => {
    const built = buildPlots(rows, geometryField, idField);
    setPlots(validatePlots(built));
    setHighlightedKey(null);
  }, []);

  /** Clears the current plots (a new file was chosen). */
  const handleReset = useCallback(() => {
    setPlots([]);
    setHighlightedKey(null);
  }, []);

  /**
   * Toggles the selection check of one plot.
   * @param {string} key - Plot key.
   * @param {boolean} selected - New selection value.
   */
  const handleToggle = useCallback((key, selected) => {
    setPlots((current) => current.map((p) => (p.key === key ? p.withSelected(selected) : p)));
  }, []);

  /**
   * Toggles the selection check of every plot.
   * @param {boolean} selected - New selection value.
   */
  const handleToggleAll = useCallback((selected) => {
    setPlots((current) => current.map((p) => p.withSelected(selected)));
  }, []);

  return (
    <div className="app">
      <header className="app__header">
        <h1>{APP_TITLE}</h1>
      </header>

      <section className="app__section">
        <h2>Datos</h2>
        <Input onProcess={handleProcess} onReset={handleReset} />
      </section>

      <section className="app__section app__section--validation">
        <h2>Validación</h2>
        <div className="app__validation">
          <div className="app__validation-table">
            <Plots
              plots={plots}
              onToggle={handleToggle}
              onToggleAll={handleToggleAll}
              highlightedKey={highlightedKey}
              onHighlight={setHighlightedKey}
            />
          </div>
          <div className="app__validation-map">
            <Map plots={plots} highlightedKey={highlightedKey} onHighlight={setHighlightedKey} />
          </div>
        </div>
      </section>

      <section className="app__section">
        <h2>Exportación</h2>
        <Export plots={plots} />
      </section>
    </div>
  );
}
