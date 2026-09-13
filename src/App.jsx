import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from './components/layout/Header.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { Footer } from './components/layout/Footer.jsx';
import { FilterPanel } from './components/filters/FilterPanel.jsx';
import { ResultsSummary } from './components/events/ResultsSummary.jsx';
import { EventList } from './components/events/EventList.jsx';
import { EventMap } from './components/map/EventMap.jsx';
import { useEvents } from './hooks/useEvents.js';
import { useWeather } from './hooks/useWeather.js';
import { useRecentSearches } from './hooks/useRecentSearches.js';
import { useDocumentTitle, useUrlSync } from './hooks/useUrlSync.js';
import styles from './App.module.css';

/**
 * Application shell.
 *
 * Owns the search state — place, radius, category and text filters, selection —
 * and passes it down. Data fetching lives in `useEvents`; this component only
 * decides *what* to ask for and *how* to lay the answer out.
 */
export default function App() {
  const { initial, sync } = useUrlSync();

  const [place, setPlace] = useState(initial.place);
  const [radius, setRadius] = useState(initial.radius);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

  const { recent, remember } = useRecentSearches();
  const filters = useMemo(() => ({ categories, query }), [categories, query]);
  const { events, allEvents, categoryCounts, sources, isLoading, error, refresh } =
    useEvents(place, radius, filters);
  const weather = useWeather(place);

  useDocumentTitle(place?.name);

  useEffect(() => sync(place, radius), [place, radius, sync]);

  // A new search or a new radius invalidates the previous selection, so both
  // handlers clear it rather than relying on an effect to notice afterwards.
  const handleSelectPlace = useCallback(
    (nextPlace) => {
      setPlace(nextPlace);
      setCategories([]);
      setQuery('');
      setSelectedId(null);
      remember(nextPlace);
    },
    [remember],
  );

  const handleRadiusChange = useCallback((nextRadius) => {
    setRadius(nextRadius);
    setSelectedId(null);
  }, []);

  const handleToggleCategory = useCallback((id) => {
    setCategories((previous) =>
      previous.includes(id)
        ? previous.filter((entry) => entry !== id)
        : [...previous, id],
    );
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setSelectedId((current) => (current === event.id ? null : event.id));
  }, []);

  // Only a selection made in the list should move the map, otherwise clicking a
  // marker would recentre the map under the user's cursor.
  const focused = useMemo(
    () => events.find((event) => event.id === selectedId) ?? null,
    [events, selectedId],
  );

  return (
    <div className={styles.app}>
      <Header
        onSelectPlace={handleSelectPlace}
        recent={recent}
        initialQuery={initial.place?.name ?? ''}
      />

      <main className={styles.main}>
        <Sidebar
          isExpanded={isSheetExpanded}
          onToggle={() => setIsSheetExpanded((value) => !value)}
          count={events.length}
        >
          <ResultsSummary
            place={place}
            total={allEvents.length}
            shown={events.length}
            isLoading={isLoading}
            sources={sources}
            weather={weather}
          />

          {place && (
            <FilterPanel
              categories={categories}
              counts={categoryCounts}
              radius={radius}
              query={query}
              disabled={isLoading}
              onToggleCategory={handleToggleCategory}
              onClearCategories={() => setCategories([])}
              onRadiusChange={handleRadiusChange}
              onQueryChange={setQuery}
            />
          )}

          <EventList
            events={events}
            isLoading={isLoading}
            error={error}
            hasPlace={Boolean(place)}
            selectedId={selectedId}
            onSelect={handleSelectEvent}
            onRetry={refresh}
          />
        </Sidebar>

        <EventMap
          place={place}
          radius={radius}
          events={events}
          selectedId={selectedId}
          focused={focused}
          onSelect={handleSelectEvent}
        />
      </main>

      <Footer sources={sources} />
    </div>
  );
}
