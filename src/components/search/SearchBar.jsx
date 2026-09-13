import { useEffect, useId, useRef, useState } from 'react';
import { usePlaceSearch } from '../../hooks/usePlaceSearch.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';
import { SEARCH } from '../../constants/config.js';
import { Spinner } from '../ui/Spinner.jsx';
import { SuggestionList } from './SuggestionList.jsx';
import styles from './SearchBar.module.css';

/**
 * City search with live suggestions, keyboard navigation and a "near me"
 * shortcut.
 *
 * The component owns only the text in the box; the selected place is lifted to
 * the app so the map, the list and the URL all stay in step.
 *
 * @param {{
 *   onSelect: (place: import('../../api/nominatim.js').Place) => void,
 *   recent?: import('../../api/nominatim.js').Place[],
 *   initialQuery?: string,
 * }} props
 */
export function SearchBar({ onSelect, recent = [], initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listboxId = useId();

  const { suggestions, isSearching, error } = usePlaceSearch(query);
  const { locate, isLocating, error: geoError, isSupported } = useGeolocation();

  // Recent searches stand in for suggestions while the box is empty.
  const options = query.trim().length >= SEARCH.minQueryLength ? suggestions : recent;

  // Close the dropdown when focus or a click leaves the component.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen]);

  const commit = (place) => {
    if (!place) return;
    setQuery(place.name);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
    onSelect(place);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!options.length) return;
      setIsOpen(true);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((index) => (index + step + options.length) % options.length);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      // Enter takes the highlighted option, or the best match when the user
      // typed a name and never opened the list.
      commit(options[activeIndex] ?? options[0]);
    }
  };

  const handleLocate = async () => {
    const place = await locate();
    if (place) commit(place);
  };

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <div className={styles.field}>
        <span className={styles.icon} aria-hidden="true">
          🔎
        </span>

        <input
          ref={inputRef}
          className={styles.input}
          type="search"
          value={query}
          placeholder="Search a city — try Turku"
          aria-label="Search for a city"
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            // The option list is about to change underneath the highlight.
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />

        {isSearching && <Spinner size="sm" label="Searching places" />}

        {isSupported && (
          <button
            type="button"
            className={styles.locate}
            onClick={handleLocate}
            disabled={isLocating}
            title="Use my current location"
          >
            {isLocating ? <Spinner size="sm" label="Locating" /> : '📍'}
            <span className={styles.locateLabel}>Near me</span>
          </button>
        )}
      </div>

      {isOpen && (
        <SuggestionList
          id={listboxId}
          options={options}
          activeIndex={activeIndex}
          heading={query.trim().length >= SEARCH.minQueryLength ? null : 'Recent searches'}
          emptyMessage={
            isSearching
              ? 'Searching…'
              : query.trim().length >= SEARCH.minQueryLength
                ? `No places match “${query.trim()}”`
                : 'Type at least two characters'
          }
          onHover={setActiveIndex}
          onSelect={commit}
        />
      )}

      {(error || geoError) && <p className={styles.error}>{error || geoError}</p>}
    </div>
  );
}
