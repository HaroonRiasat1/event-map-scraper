import { Circle, MapContainer, Marker, TileLayer } from 'react-leaflet';
import { MAP } from '../../constants/config.js';
import { countByCategory } from '../../services/eventsService.js';
import { useMemo } from 'react';
import { EventMarkers } from './EventMarkers.jsx';
import { MapController } from './MapController.jsx';
import { MapLegend } from './MapLegend.jsx';
import { createOriginIcon } from './markerIcon.js';
import './markers.css';
import styles from './EventMap.module.css';

/**
 * The map surface: tiles, the search-radius circle, one marker per result and
 * a legend.
 *
 * @param {{
 *   place: import('../../api/nominatim.js').Place | null,
 *   radius: number,
 *   events: import('../../types').EventItem[],
 *   selectedId: string | null,
 *   focused: import('../../types').EventItem | null,
 *   onSelect: (event: import('../../types').EventItem) => void,
 * }} props
 */
export function EventMap({ place, radius, events, selectedId, focused, onSelect }) {
  const counts = useMemo(() => countByCategory(events), [events]);

  return (
    <div className={styles.container}>
      <MapContainer
        center={MAP.defaultCenter}
        zoom={MAP.defaultZoom}
        minZoom={MAP.minZoom}
        maxZoom={MAP.maxZoom}
        zoomControl
        scrollWheelZoom
        className={styles.map}
        // Leaflet renders a world copy at low zoom; clamp panning to one globe.
        worldCopyJump
      >
        <TileLayer
          url={MAP.tileUrl}
          attribution={MAP.tileAttribution}
          maxZoom={MAP.maxZoom}
        />

        {place && (
          <>
            <Circle
              center={place.coordinates}
              radius={radius}
              pathOptions={{
                // SVG presentation attributes cannot read CSS variables, so the
                // accent colour is repeated literally here.
                color: '#38bdf8',
                fillColor: '#38bdf8',
                fillOpacity: 0.05,
                weight: 1.5,
                dashArray: '6 8',
              }}
            />
            <Marker
              position={place.coordinates}
              icon={createOriginIcon()}
              interactive={false}
            />
          </>
        )}

        <EventMarkers events={events} selectedId={selectedId} onSelect={onSelect} />

        <MapController place={place} radius={radius} focused={focused} />
      </MapContainer>

      <MapLegend counts={counts} />
    </div>
  );
}
