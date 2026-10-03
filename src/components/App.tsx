import {useEffect, useMemo, useRef, useState} from 'react';
import type {Basket} from '../domain/basket';
import type {Game} from '../domain/game';
import {useWishlist} from '../hooks/useWishlist';
import {useBaskets} from '../hooks/useBaskets';
import {SearchForm} from './SearchForm';
import {GamePicker} from './GamePicker';
import {BasketList} from './BasketList';
import {FreeGames} from './FreeGames';
import {EmptyState} from './EmptyState';
import {formatPence} from './format';
import './app.css';

const NO_GAMES: Game[] = [];
const TOP_N = 20;
// Fixed until the ranking slider comes back: halfway between "most games" and "favourites".
const WEIGHT = 0.5;

export function App() {
    const [steamId, setSteamId] = useState('');
    const [budget, setBudget] = useState(0);
    const [excludedIds, setExcludedIds] = useState<number[]>([]);

    const {games, isLoading, error} = useWishlist(steamId);
    const allGames = games ?? NO_GAMES;

    // Excluded games are removed from the list before the algorithm runs.
    const candidates = useMemo(() => {
        if (excludedIds.length === 0) return allGames;
        const excluded = new Set(excludedIds);
        return allGames.filter((g) => !excluded.has(g.appId));
    }, [allGames, excludedIds]);

    // The entered budget is the algorithm's budget; it reruns when the user submits a new amount.
    const {baskets, isComputing} = useBaskets(candidates, budget, WEIGHT);

    // Never flash an empty list while recomputing: fall back to the last settled result.
    const settled = useRef<Basket[]>([]);
    useEffect(() => {
        if (!isComputing) settled.current = baskets;
    }, [baskets, isComputing]);
    const source = isComputing && baskets.length === 0 ? settled.current : baskets;

    const visible = useMemo(() => source.slice(0, TOP_N), [source]);

    const freeGames = useMemo(
        () => allGames.filter((g) => g.price === 0).sort((a, b) => a.rank - b.rank),
        [allGames],
    );
    const paidGames = useMemo(() => allGames.filter((g) => g.price > 0), [allGames]);

    const cheapest = useMemo(() => {
        const prices = candidates.filter((g) => g.price > 0).map((g) => g.price);
        return prices.length ? Math.min(...prices) : null;
    }, [candidates]);

    function search(id: string, amount: number) {
        if (id !== steamId) setExcludedIds([]);
        setSteamId(id);
        setBudget(amount);
    }

    const exclude = (id: number) => setExcludedIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
    const unexclude = (id: number) => setExcludedIds((ids) => ids.filter((x) => x !== id));

    const hasWishlist = games !== undefined && !isLoading && !error;

    function renderResults() {
        if (!steamId) {
            return (
                <EmptyState title="Find the best way to spend your budget">
                    <p>
                        Enter your Steam ID to see which combinations of your wishlist games you can buy right now,
                        using
                        current sale prices.
                    </p>
                </EmptyState>
            );
        }
        if (isLoading) {
            return (
                <div className="loading" role="status">
                    <span className="spinner" aria-hidden="true"/> Fetching your wishlist and prices…
                </div>
            );
        }
        if (error || !games) return null;
        if (games.length === 0) {
            return (
                <EmptyState title="Your wishlist is empty">
                    <p>Add some games to your Steam wishlist and try again.</p>
                </EmptyState>
            );
        }
        if (visible.length === 0 && !isComputing) {
            return (
                <EmptyState title="Nothing affordable at this budget">
                    {cheapest !== null && (
                        <p>The cheapest game on your list is {formatPence(cheapest)}. Try raising the budget.</p>
                    )}
                </EmptyState>
            );
        }
        return <BasketList baskets={visible} budget={budget} isComputing={isComputing}/>;
    }

    return (
        <div className="app">
            <header className="app__header">
                <h1>Wishlist Budget</h1>
                <p className="app__tagline">The best games your money can buy from your Steam wishlist.</p>
            </header>

            <div className="app__layout">
                <aside className="app__controls">
                    <SearchForm onSubmit={search} isLoading={isLoading} error={error}/>
                    {hasWishlist && games.length > 0 && (
                        <div className="card controls">
                            <GamePicker
                                games={paidGames}
                                excludedIds={excludedIds}
                                onExclude={exclude}
                                onUnexclude={unexclude}
                            />
                        </div>
                    )}
                </aside>

                <main className="app__results">
                    {renderResults()}
                    {hasWishlist && <FreeGames games={freeGames}/>}
                </main>
            </div>
        </div>
    );
}
