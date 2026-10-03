import { useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import type { Game } from '../domain/game';
import { formatPence } from './format';

type Props = {
  games: Game[];
  excludedIds: number[];
  onExclude: (appId: number) => void;
  onUnexclude: (appId: number) => void;
};

const MAX_SUGGESTIONS = 8;

export function GamePicker({ games, excludedIds, onExclude, onUnexclude }: Props) {
  const [query, setQuery] = useState('');

  const byId = useMemo(() => new Map(games.map((g) => [g.appId, g])), [games]);
  const fuse = useMemo(
    () => new Fuse(games, { keys: ['name'], threshold: 0.4, ignoreLocation: true }),
    [games],
  );

  const excludedSet = useMemo(() => new Set(excludedIds), [excludedIds]);

  const suggestions = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return fuse
      .search(q, { limit: MAX_SUGGESTIONS + excludedSet.size })
      .map((r) => r.item)
      .filter((g) => !excludedSet.has(g.appId))
      .slice(0, MAX_SUGGESTIONS);
  }, [fuse, query, excludedSet]);

  function exclude(appId: number) {
    onExclude(appId);
    setQuery('');
  }

  const excluded = excludedIds.map((id) => byId.get(id)).filter((g): g is Game => !!g);

  return (
    <div className="picker">
      <label htmlFor="game-search" className="field-label">
        Exclude games
      </label>
      <input
        id="game-search"
        className="text-input"
        type="search"
        placeholder="Search your wishlist…"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
        aria-controls="game-suggestions"
      />

      {query.trim() !== '' && (
        <ul id="game-suggestions" className="suggestions" aria-label="Matching games">
          {suggestions.length === 0 && <li className="suggestions__empty">No matching games</li>}
          {suggestions.map((g) => (
            <li key={g.appId} className="suggestion">
              <span className="suggestion__name">{g.name}</span>
              <span className="suggestion__price">{formatPence(g.price)}</span>
              <span className="suggestion__actions">
                <button type="button" className="button button--small" onClick={() => exclude(g.appId)}>
                  Exclude
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {excluded.length > 0 && (
        <div className="chip-group">
          <h3 className="chip-group__title">Excluded</h3>
          <ul className="chips">
            {excluded.map((g) => (
              <li key={g.appId} className="chip chip--exclude">
                <span className="chip__label">{g.name}</span>
                <button
                  type="button"
                  className="chip__remove"
                  onClick={() => onUnexclude(g.appId)}
                  aria-label={`Stop excluding ${g.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
