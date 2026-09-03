# Validación y exportación de predios

Portal web de una sola página (React + Vite) que convierte la información de predios
recolectada en archivos Excel (formularios ODK / KoboToolbox) a formato GeoJSON, valida
espacialmente los polígonos, los visualiza sobre OpenStreetMap y permite exportarlos para
su uso en otros sistemas de información geográfica.

## Funcionalidades

1. **Datos**: carga de un archivo Excel (`.xlsx`, `.xls`). El sistema detecta las columnas
   con información espacial (polígonos, puntos, latitud/longitud) y pide al usuario elegir
   el campo con el que se construyen los polígonos y el campo identificador.
2. **Construcción**: cada fila se convierte en un `Feature` GeoJSON tipo `Polygon`; el resto
   de columnas se adjuntan como `properties`.
3. **Validación**: cada polígono se revisa y queda en estado `OK` o `ERROR`. Validaciones:
   - Sin geometría
   - Coordenadas no numéricas
   - Coordenadas fuera de rango (lat ±90, lon ±180)
   - Polígono no cerrado (primer y último vértice difieren)
   - Menos de 3 vértices distintos
   - Vértices consecutivos duplicados
   - El polígono se auto-intersecta
   - Área nula o degenerada
   - Identificador vacío
   - Identificador duplicado
4. **Visualización**: tabla (check, mapa, ID, estado, errores) a la izquierda y mapa a la
   derecha. Polígonos verdes = `OK`, rojos = `ERROR`. Al pasar el cursor sobre una fila se
   resalta el polígono y viceversa. La columna **Mapa** es un interruptor que muestra u oculta
   cada polígono en el mapa (todos visibles por defecto); solo afecta la visualización, no la
   selección para exportar ni la validación.
5. **Exportación**: exporta los predios marcados con el check. Un predio se descarga como
   `<ID>.geojson`; varios predios se descargan como `predios_geojson.zip` con un
   `.geojson` por predio.

## Formato de coordenadas soportado

- ODK / KoboToolbox *geoshape*: `lat lon alt precisión;lat lon alt precisión;...`
- WKT: `POLYGON((lon lat, lon lat, ...))`
- Pares `lat,lon` separados por `;`

Las coordenadas se escriben en el GeoJSON como `[longitud, latitud]` (WGS84).

## Estructura del código

```
src/
  models/Plot.js            Entidad Predio compartida por todos los componentes
  services/excelReader.js   Lectura del Excel (SheetJS)
  services/spatialFields.js Detección de campos espaciales y sugerencia de identificadores
  services/geometryBuilder.js Construcción de geometrías GeoJSON y de los predios
  services/validator.js     Validaciones espaciales y de atributos (Turf.js)
  services/exporter.js      Exportación a .geojson / .zip (JSZip)
  components/Input/         Sección de entrada (carga y selección de campos)
  components/Plots/         Tabla de predios
  components/Map/           Mapa (Leaflet + OpenStreetMap)
  components/Export/        Botón de exportación
  App.jsx                   Diagramación: Encabezado, Datos, Validación, Exportación
```

El código y sus comentarios están en inglés; la interfaz está en español.

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # genera dist/
npm run preview  # previsualiza dist/
```

El trabajo se realiza en la rama `develop`; `main` es la rama de despliegue.

