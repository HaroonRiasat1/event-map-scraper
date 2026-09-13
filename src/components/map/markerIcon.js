/**
 * Leaflet marker factory.
 *
 * Markers are built as `divIcon`s rather than images so their colour can follow
 * the category palette and so the selected state can be styled in CSS.
 */

import L from 'leaflet';
import { categoryColor, categoryIcon } from '../../utils/categories.js';

/** Cache icons per category+state — Leaflet re-creates markers on every pan. */
const iconCache = new Map();

/**
 * @param {string} categoryId
 * @param {boolean} isSelected
 * @returns {L.DivIcon}
 */
export function createMarkerIcon(categoryId, isSelected = false) {
  const key = `${categoryId}:${isSelected}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const color = categoryColor(categoryId);
  const size = isSelected ? 42 : 32;

  const icon = L.divIcon({
    className: 'ems-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 6],
    html: `
      <span class="ems-marker__pin${isSelected ? ' ems-marker__pin--selected' : ''}"
            style="--marker-color:${color}">
        <span class="ems-marker__glyph">${categoryIcon(categoryId)}</span>
      </span>
    `,
  });

  iconCache.set(key, icon);
  return icon;
}

/** Marker for the searched location itself. */
export const createOriginIcon = () =>
  L.divIcon({
    className: 'ems-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: '<span class="ems-marker__origin"></span>',
  });
