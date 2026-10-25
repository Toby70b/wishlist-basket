import type { Basket } from '../domain/basket';
import type { Game } from '../domain/game';
import { formatPence, formatScore } from './format';
import { GameCapsule } from './GameCapsule';

const MAX_THUMBS = 5;

type Props = {
  basket: Basket;
  position: number; // 1-based
  budget: number; // pence
};

export function BasketCard({ basket, position, budget }: Props) {
  const games = [...basket.games].sort((a, b) => a.rank - b.rank);
  const thumbs = games.slice(0, MAX_THUMBS);
  const hiddenCount = games.length - thumbs.length;

  return (
    <li className="basket">
      <details>
        <summary className="basket__summary">
          <span className="basket__position">#{position}</span>
          <dl className="basket__stats">
            <Stat label="Spent" value={formatPence(basket.totalCost)} />
            <Stat label="Left" value={formatPence(budget - basket.totalCost)} />
            <Stat label="Games" value={String(basket.games.length)} />
            <Stat label="Score" value={formatScore(basket.score)} />
          </dl>
          <span className="basket__chevron" aria-hidden="true" />
          <span className="basket__thumbs" aria-hidden="true">
            {thumbs.map((g) => (
              <GameCapsule key={g.appId} appId={g.appId} size="thumb" />
            ))}
            {hiddenCount > 0 && <span className="basket__more">+{hiddenCount}</span>}
          </span>
        </summary>

        <table className="basket__games">
          <thead>
            <tr>
              <th scope="col">Game</th>
              <th scope="col" className="num">Rank</th>
              <th scope="col" className="num">Price</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => (
              <GameRow key={g.appId} game={g} />
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={2}>Total</th>
              <td className="num">{formatPence(basket.totalCost)}</td>
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

function GameRow({ game }: { game: Game }) {
  // Free to play has no price at all; a 100%-off game shows its usual price struck through.
  const { price, originalPrice } = game;
  const onSale = originalPrice !== null && game.discountPercent > 0;
  return (
    <tr>
      <td>
        <span className="game-cell">
          <GameCapsule key={game.appId} appId={game.appId} />
          <span className="game-cell__name">{game.name}</span>
        </span>
      </td>
      <td className="num">#{game.rank}</td>
      <td className="num price-cell">
        {onSale && <span className="badge-sale">−{game.discountPercent}%</span>}
        {onSale && <s className="price-original">{formatPence(originalPrice)}</s>}
        <span className="price-final">{price === null || price === 0 ? 'Free' : formatPence(price)}</span>
      </td>
    </tr>
  );
}
