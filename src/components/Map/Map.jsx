/**
 * @file Map section: renders every plot polygon over OpenStreetMap tiles,
 * green when valid and red when it has errors.
 */
import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PlotStatus } from '../../models/Plot.js';
import { drawablePlots } from '../../services/mapUtils.js';
import './Map.css';

/** Default view (Honduras) used until plots are loaded. */
const DEFAULT_CENTER = [14.6, -86.8];
const DEFAULT_ZOOM = 7;

/** Leaflet path styles per status. */
const STYLES = {
  [PlotStatus.OK]: { color: '#1b8a3a', fillColor: '#1b8a3a', weight: 2, fillOpacity: 0.35 },
  [PlotStatus.ERROR]: { color: '#c62828', fillColor: '#c62828', weight: 2, fillOpacity: 0.35 },
  highlight: { weight: 4, fillOpacity: 0.55 },
};

/**
 * Helper component that fits the map to the bounds of the drawn plots
 * whenever the plot list changes.
 *
 * @param {object} props
 * @param {import('../../models/Plot.js').Plot[]} props.plots - Drawable plots.
 * @returns {null}
 */
function FitBounds({ plots }) {
  const map = useMap();
  useEffect(() => {
    if (plots.length === 0) return;
    const layer = L.geoJSON({ type: 'FeatureCollection', features: plots.map((p) => p.toFeature()) });
    const bounds = layer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
  }, [map, plots]);
  return null;
}

/**
 * Map component.
 *
 * @param {object} props
 * @param {import('../../models/Plot.js').Plot[]} props.plots - Validated plots.
 * @param {string|null} props.highlightedKey - Key of the plot to emphasise.
 * @param {(key: string|null) => void} props.onHighlight - Reports the hovered plot back to the parent.
 * @returns {JSX.Element}
 */
export default function Map({ plots, highlightedKey, onHighlight }) {
  const drawable = useMemo(() => drawablePlots(plots), [plots]);

  return (
    <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="map" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {drawable.map((plot) => {
        const isHighlighted = plot.key === highlightedKey;
        const style = { ...STYLES[plot.status], ...(isHighlighted ? STYLES.highlight : {}) };
        return (
          <GeoJSON
            // Changing the key forces Leaflet to re-style the layer when highlight changes.
            key={`${plot.key}-${isHighlighted ? 'h' : 'n'}`}
            data={plot.toFeature()}
            style={style}
            eventHandlers={{
              mouseover: () => onHighlight(plot.key),
              mouseout: () => onHighlight(null),
            }}
          >
            <Tooltip sticky>
              <strong>{plot.id || `Fila ${plot.rowIndex}`}</strong> — {plot.status}
              {plot.errors.length > 0 && (
                <ul className="map__tooltip-errors">
                  {plot.errors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              )}
            </Tooltip>
          </GeoJSON>
        );
      })}
      <FitBounds plots={drawable} />
    </MapContainer>
  );
}
