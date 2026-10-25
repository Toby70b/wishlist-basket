import type { Basket } from '../domain/basket';
import type { Game } from '../domain/game';
import { formatPence, formatScore } from './format';

type Props = {
  basket: Basket;
  position: number; // 1-based
  budget: number; // pence
};

export function BasketCard({ basket, position, budget }: Props) {
  // Requires Basket.breakdown (see notes for Toby).
  const points = new Map(basket.breakdown.map((b) => [b.appId, b.points]));
  const games = [...basket.games].sort((a, b) => a.rank - b.rank);

  return (
    <li className="basket">
      <details>
        <summary className="basket__summary">
          <span className="basket__position">#{position}</span>
          <dl className="basket__stats">
            <Stat label="Spent" value={formatPence(basket.total)} />
            <Stat label="Left" value={formatPence(budget - basket.total)} />
            <Stat label="Games" value={String(basket.games.length)} />
            <Stat label="Score" value={formatScore(basket.score)} />
          </dl>
          <span className="basket__chevron" aria-hidden="true" />
        </summary>

        <table className="basket__games">
          <thead>
            <tr>
              <th scope="col">Game</th>
              <th scope="col" className="num">Rank</th>
              <th scope="col" className="num">Price</th>
              <th scope="col" className="num">Points</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => (
              <GameRow key={g.appId} game={g} points={points.get(g.appId)} />
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={2}>Total</th>
              <td className="num">{formatPence(basket.total)}</td>
              <td className="num">{formatScore(basket.score)}</td>
            </tr>
          </tfoot>
        </table>
      </details>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function GameRow({ game, points }: { game: Game; points: number | undefined }) {
  // Free to play has no price at all; a 100%-off game shows its usual price struck through.
  const { price, originalPrice } = game;
  const onSale = originalPrice !== null && game.discountPercent > 0;
  return (
    <tr>
      <td>{game.name}</td>
      <td className="num">#{game.rank}</td>
      <td className="num price-cell">
        {onSale && <span className="badge-sale">−{game.discountPercent}%</span>}
        {onSale && <s className="price-original">{formatPence(originalPrice)}</s>}
        <span className="price-final">{price === null || price === 0 ? 'Free' : formatPence(price)}</span>
      </td>
      <td className="num">{points === undefined ? '—' : formatScore(points)}</td>
    </tr>
  );
}
