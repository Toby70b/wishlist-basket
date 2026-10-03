import type { Game } from '../domain/game';

export function FreeGames({ games }: { games: Game[] }) {
  if (games.length === 0) return null;
  return (
    <section className="card free-games" aria-labelledby="free-title">
      <h2 id="free-title">These are free — grab them</h2>
      <ul className="free-games__list">
        {games.map((g) => (
          <li key={g.appId}>
            <a href={`https://store.steampowered.com/app/${g.appId}`} target="_blank" rel="noreferrer">
              {g.name}
            </a>
            {g.discountPercent === 100 && <span className="badge-sale">−100%</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
