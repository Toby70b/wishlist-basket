import {useState} from 'react';
import {useWishlist} from '../hooks/useWishlist';
import {useBaskets} from '../hooks/useBaskets';
import {SearchForm} from './SearchForm';
import {BasketList} from './BasketList';
import {FreeGames} from './FreeGames';
import {EmptyState} from './EmptyState';
import {formatPence} from './format';
import './app.css';

export function App() {
    const [steamId, setSteamId] = useState('');
    const [budget, setBudget] = useState(0);

    const {games, isLoading, error} = useWishlist(steamId);

    // The entered budget is the algorithm's budget; it reruns when the user submits a new amount.
    const {baskets: visible, freeGames, cheapestPrice, isComputing} = useBaskets(games, budget);

    function search(id: string, amount: number) {
        setSteamId(id);
        setBudget(amount);
    }

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
                    {cheapestPrice !== null && (
                        <p>The cheapest game on your list is {formatPence(cheapestPrice)}. Try raising the budget.</p>
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
                </aside>

                <main className="app__results">
                    {renderResults()}
                    {hasWishlist && <FreeGames games={freeGames}/>}
                </main>
            </div>
        </div>
    );
}
