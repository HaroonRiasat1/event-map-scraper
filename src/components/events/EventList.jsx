import { useEffect, useRef } from 'react';
import { EmptyState } from '../ui/EmptyState.jsx';
import { ErrorBanner } from '../ui/ErrorBanner.jsx';
import { SkeletonList } from '../ui/SkeletonList.jsx';
import { EventCard } from './EventCard.jsx';
import styles from './EventList.module.css';

/**
 * Scrollable result list. Keeps the selected card in view when selection is
 * driven from the map.
 *
 * @param {{
 *   events: import('../../types').EventItem[],
 *   isLoading: boolean,
 *   error: string,
 *   hasPlace: boolean,
 *   selectedId: string | null,
 *   onSelect: (event: import('../../types').EventItem) => void,
 *   onRetry: () => void,
 * }} props
 */
export function EventList({
  events,
  isLoading,
  error,
  hasPlace,
  selectedId,
  onSelect,
  onRetry,
}) {
  const listRef = useRef(null);

  useEffect(() => {
    if (!selectedId) return;
    const node = listRef.current?.querySelector(`[data-id="${CSS.escape(selectedId)}"]`);
    node?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  if (error) {
    return (
      <div className={styles.padded}>
        <ErrorBanner message={error} onRetry={onRetry} />
      </div>
    );
  }

  if (isLoading) return <SkeletonList />;

  if (!hasPlace) {
    return (
      <EmptyState
        icon="🗺️"
        title="Find what's on near you"
        description="Search for a city — Turku, Berlin, Lisbon — or use “Near me” to scrape the map for venues and events around you."
      />
    );
  }

  if (!events.length) {
    return (
      <EmptyState
        icon="🫥"
        title="Nothing matched"
        description="Try a wider radius, clear a category filter, or search a nearby city."
      />
    );
  }

  return (
    <ul className={styles.list} ref={listRef}>
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          isSelected={event.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}
