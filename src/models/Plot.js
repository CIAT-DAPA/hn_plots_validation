/**
 * @file Plot entity. A Plot ("predio") is the unit of information shared between
 * the Input, Plots, Map and Export components.
 */

/** Possible validation states of a plot. */
export const PlotStatus = Object.freeze({
  OK: 'OK',
  ERROR: 'ERROR',
});

/**
 * Represents a single land plot read from one Excel row.
 */
export class Plot {
  /**
   * Creates a new Plot.
   *
   * @param {object} params
   * @param {string} params.id - Identifier chosen by the user (value of the id field).
   * @param {number} params.rowIndex - 1-based row number in the Excel sheet (header excluded).
   * @param {object|null} params.geometry - GeoJSON Polygon geometry, or null when it could not be built.
   * @param {object} params.properties - All other Excel columns as key/value attributes.
   * @param {string[]} [params.errors=[]] - Validation messages that failed.
   * @param {boolean} [params.selected=true] - Whether the plot is checked for export.
   */
  constructor({ id, rowIndex, geometry, properties, errors = [], selected = true }) {
    this.id = id;
    this.rowIndex = rowIndex;
    this.geometry = geometry;
    this.properties = properties;
    this.errors = errors;
    this.selected = selected;
  }

  /**
   * Derived validation status.
   * @returns {string} PlotStatus.OK when there are no errors, PlotStatus.ERROR otherwise.
   */
  get status() {
    return this.errors.length === 0 ? PlotStatus.OK : PlotStatus.ERROR;
  }

  /**
   * Convenience flag for the status.
   * @returns {boolean} True when the plot passed every validation.
   */
  get isValid() {
    return this.status === PlotStatus.OK;
  }

  /**
   * Unique key to use in React lists (id may be duplicated across rows).
   * @returns {string}
   */
  get key() {
    return `${this.rowIndex}-${this.id}`;
  }

  /**
   * Builds a GeoJSON Feature for this plot. The identifier is stored both as the
   * Feature "id" and inside properties so downstream systems can read either.
   *
   * @returns {object} GeoJSON Feature.
   */
  toFeature() {
    return {
      type: 'Feature',
      id: this.id,
      geometry: this.geometry,
      properties: {
        id: this.id,
        ...this.properties,
        validation_status: this.status,
        validation_errors: this.errors,
      },
    };
  }

  /**
   * Builds a GeoJSON FeatureCollection containing only this plot. This is the
   * document written to disk when exporting.
   *
   * @returns {object} GeoJSON FeatureCollection.
   */
  toGeoJSON() {
    return {
      type: 'FeatureCollection',
      features: [this.toFeature()],
    };
  }

  /**
   * Returns a shallow copy with the selection flag replaced. Plots are treated as
   * immutable inside React state, so updates create new instances.
   *
   * @param {boolean} selected
   * @returns {Plot}
   */
  withSelected(selected) {
    return new Plot({ ...this, selected });
  }
}
