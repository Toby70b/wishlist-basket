import type { Basket } from '../domain/basket';
import { BasketCard } from './BasketCard';

type Props = {
  baskets: Basket[];
  budget: number;
  isComputing: boolean;
};

export function BasketList({ baskets, budget, isComputing }: Props) {
  return (
    <section className="results" aria-labelledby="results-title" aria-busy={isComputing}>
      <header className="results__head">
        <h2 id="results-title">Best baskets</h2>
        <span className={`recalc ${isComputing ? 'recalc--on' : ''}`} role="status">
          {isComputing && (
            <>
              <span className="spinner" aria-hidden="true" /> Recalculating…
            </>
          )}
        </span>
      </header>
      <ol className={`basket-list ${isComputing ? 'basket-list--stale' : ''}`}>
        {baskets.map((b, i) => (
          <BasketCard
            key={b.games.map((g) => g.appId).sort((x, y) => x - y).join('-')}
            basket={b}
            position={i + 1}
            budget={budget}
          />
        ))}
      </ol>
    </section>
  );
}
