import { useCallback, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { MAP } from '../../constants/config.js';
import { isValidCoordinate, zoomForRadius } from '../../utils/geo.js';

/**
 * Imperative map behaviour, isolated in one child component.
 *
 * `useMap` is only available inside `<MapContainer>`, so this renders nothing
 * and exists purely to drive the map instance from React state.
 *
 * @param {{
 *   place: import('../../api/nominatim.js').Place | null,
 *   radius: number,
 *   focused: import('../../types').EventItem | null,
 * }} props
 */
export function MapController({ place, radius, focused }) {
  const map = useMap();

  /**
   * Move the viewport, safely.
   *
   * Two Leaflet traps are avoided here. `flyTo` interpolates zoom with a
   * logarithm that divides by the container size, which is still zero on the
   * first paint and yields `Invalid LatLng object: (NaN, NaN)`; `setView` and
   * `fitBounds` do no such interpolation, and animate a short hop while jumping
   * for anything longer, which is the behaviour we want anyway. And `map.stop()`
   * — the documented way to cancel an in-flight animation — itself re-centres
   * via `getCenter()` on a map that may not have been positioned yet, producing
   * the same NaN. Re-measuring the container is enough on its own.
   *
   * @param {[number, number] | [[number, number], [number, number]]} target
   *   A coordinate pair, or bounds to fit
   * @param {number} zoom Ignored when `target` is bounds
   */
  const moveTo = useCallback(
    (target, zoom) => {
      map.invalidateSize({ animate: false });

      const { x, y } = map.getSize();
      const animate = x > 0 && y > 0;

      if (Array.isArray(target[0])) {
        map.fitBounds(target, {
          padding: [48, 48],
          maxZoom: MAP.locationZoom,
          animate,
        });
      } else {
        map.setView(target, zoom, { animate });
      }
    },
    [map],
  );

  // Move to the searched place. Fitting its bounding box frames a whole city
  // better than a fixed zoom, but small places have a tiny box — fall back to a
  // zoom derived from the search radius.
  useEffect(() => {
    if (!place || !isValidCoordinate(place.coordinates)) return;
    moveTo(place.bounds ?? place.coordinates, zoomForRadius(radius));
  }, [moveTo, place, radius]);

  // Centre the map on a card the user selected in the list.
  useEffect(() => {
    if (!focused || !isValidCoordinate(focused.coordinates)) return;
    moveTo(focused.coordinates, Math.max(map.getZoom() || MAP.locationZoom, 15));
  }, [map, moveTo, focused]);

  // Leaflet mis-measures its container when the layout changes around it — the
  // mobile bottom sheet makes that happen often.
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  return null;
}
