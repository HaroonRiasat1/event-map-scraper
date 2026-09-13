import { placeLabel } from '../../api/nominatim.js';
import { humanizeTag } from '../../utils/string.js';
import styles from './SuggestionList.module.css';

/**
 * Dropdown of geocoding results, rendered as an ARIA listbox.
 *
 * @param {{
 *   id: string,
 *   options: import('../../api/nominatim.js').Place[],
 *   activeIndex: number,
 *   heading?: string | null,
 *   emptyMessage: string,
 *   onHover: (index: number) => void,
 *   onSelect: (place: import('../../api/nominatim.js').Place) => void,
 * }} props
 */
export function SuggestionList({
  id,
  options,
  activeIndex,
  heading,
  emptyMessage,
  onHover,
  onSelect,
}) {
  return (
    <div className={styles.dropdown}>
      {heading && options.length > 0 && <p className={styles.heading}>{heading}</p>}

      {options.length === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <ul className={styles.list} id={id} role="listbox">
          {options.map((place, index) => (
            <li key={place.id}>
              <button
                type="button"
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`${styles.option} ${index === activeIndex ? styles.active : ''}`}
                // `onMouseDown` fires before the input's blur, so the click is
                // never swallowed by the dropdown closing.
                onMouseDown={(event) => {
                  event.preventDefault();
                  onSelect(place);
                }}
                onMouseEnter={() => onHover(index)}
              >
                <span className={styles.pin} aria-hidden="true">
                  📍
                </span>
                <span className={styles.text}>
                  <span className={styles.name}>{placeLabel(place)}</span>
                  <span className={styles.address}>{place.address}</span>
                </span>
                <span className={styles.type}>{humanizeTag(place.type)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
