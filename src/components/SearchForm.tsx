import { useState, type FormEvent } from 'react';
import { formatPence } from './format';

type Props = {
  onSubmit: (steamId: string, budget: number) => void;
  isLoading: boolean;
  error: Error | null;
};

export const MIN_BUDGET = 100; // £1
export const MAX_BUDGET = 10000; // £100

// Assumes the adapter throws errors carrying a `kind` field (see notes for Toby).
type WishlistErrorKind = 'private' | 'invalid-id' | 'unavailable';

function describeError(error: Error): string {
  const kind = (error as Error & { kind?: WishlistErrorKind }).kind;
  switch (kind) {
    case 'private':
      return "That wishlist is private. In Steam, set Profile → Privacy → Game details to Public, then try again.";
    case 'invalid-id':
      return "We couldn't find a Steam account with that ID. Check it's the 17-digit SteamID64.";
    case 'unavailable':
      return 'Steam is not responding right now. Try again in a minute.';
    default:
      return error.message || 'Something went wrong loading the wishlist.';
  }
}

const STEAM_ID_64 = /^\d{17}$/;
const MONEY = /^£?\s*(\d+)(?:\.(\d{1,2}))?$/;

/** "12", "12.5", "£12.49" → pence; null if not a valid amount. */
function parsePence(input: string): number | null {
  const m = MONEY.exec(input.trim());
  if (!m) return null;
  const pounds = Number(m[1]);
  const pence = Number((m[2] ?? '0').padEnd(2, '0'));
  return pounds * 100 + pence;
}

export function SearchForm({ onSubmit, isLoading, error }: Props) {
  const [steamId, setSteamId] = useState('');
  const [budgetText, setBudgetText] = useState('20');
  const [submitted, setSubmitted] = useState(false);

  const trimmedId = steamId.trim();
  const idValid = STEAM_ID_64.test(trimmedId);
  const budget = parsePence(budgetText);
  const budgetValid = budget !== null && budget >= MIN_BUDGET && budget <= MAX_BUDGET;

  const idError = submitted && !idValid ? "That doesn't look like a SteamID64. It should be 17 digits." : null;
  const budgetError =
    submitted && !budgetValid
      ? `Enter an amount between ${formatPence(MIN_BUDGET)} and ${formatPence(MAX_BUDGET)}.`
      : null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (idValid && budgetValid) onSubmit(trimmedId, budget);
  }

  return (
    <form className="card search-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="steam-id" className="field-label">
          Steam ID
        </label>
        <input
          id="steam-id"
          className="text-input"
          inputMode="numeric"
          autoComplete="off"
          placeholder="7656119…"
          value={steamId}
          onChange={(e) => setSteamId(e.target.value)}
          aria-invalid={!!idError || !!error}
          aria-describedby="steam-id-help"
        />
        <p id="steam-id-help" className="field-help">
          Your 17-digit SteamID64. Your wishlist must be public.
        </p>
        {idError && (
          <p className="field-error" role="alert">
            {idError}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="budget" className="field-label">
          Budget
        </label>
        <div className="money-input">
          <span className="money-input__prefix" aria-hidden="true">
            £
          </span>
          <input
            id="budget"
            className="text-input"
            inputMode="decimal"
            autoComplete="off"
            value={budgetText}
            onChange={(e) => setBudgetText(e.target.value)}
            aria-invalid={!!budgetError}
          />
        </div>
        {budgetError && (
          <p className="field-error" role="alert">
            {budgetError}
          </p>
        )}
      </div>

      <button type="submit" className="button button--primary search-form__submit" disabled={isLoading}>
        {isLoading ? <span className="spinner" aria-hidden="true" /> : null}
        {isLoading ? 'Loading…' : 'Find baskets'}
      </button>

      {error && !idError && (
        <p className="field-error" role="alert">
          {describeError(error)}
        </p>
      )}
    </form>
  );
}
