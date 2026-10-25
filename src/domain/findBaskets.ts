import {Basket} from './basket';
import type {ScoredGame} from "./scoring.ts";


/**
 * The basket search. Pure: no React, no I/O.
 *
 * - `games` arrive already scored and cleaned: only basket candidates (isBasketCandidate:
 *   buyable and costs money), none over `budget`.
 * - Build baskets game by game. Adding a game to an existing basket makes a new basket;
 *   originals never change.
 * - Keep at most 20 baskets per total (per penny); drop the lowest scoring.
 * - Games are scored before they go into baskets, with a ScoringPolicy from scoring.ts
 *   (RankScoring); a basket's score is the sum.
 * - Return every kept basket sorted by score, best first. The caller takes the top N.
 */

const MAX_BASKETS_PER_TOTAL = 20;

export function findBaskets(games: ScoredGame[], budget: number): Basket[] {

    if (!games || games.length === 0 || budget <= 0) {
        return [];
    }

    let potentialBaskets = new Map<number, Basket[]>();
    for (const game of games) {
        let basketSnapshot = Array.from(potentialBaskets.values()).flat();

        for (const basket of basketSnapshot) {
            let newBasket = new Basket([...basket.scoredGames, game]);
            addNewBasketToBasketMap(newBasket, budget, potentialBaskets);
        }
        // Add new game to its own basket
        let newBasket = new Basket([game]);
        addNewBasketToBasketMap(newBasket, budget, potentialBaskets);
    }

    const basketSortedByScore = Array.from(potentialBaskets.values()).flat().sort((b1, b2) => b2.score - b1.score);

    return basketSortedByScore;
}

function addNewBasketToBasketMap(newBasket: Basket, budget: number, potentialBaskets: Map<number, Basket[]>) {
    if (newBasket.totalCost <= budget) {
        let countForTotal = potentialBaskets.get(newBasket.totalCost)?.length ?? 0;
        if (countForTotal >= MAX_BASKETS_PER_TOTAL) {
            // If we already have MAX_BASKETS_PER_TOTAL  baskets for this total, check if the new basket has a higher score than the lowest scoring basket
            let existingBaskets = potentialBaskets.get(newBasket.totalCost) ?? [];
            let lowestScoringBasket = existingBaskets.sort((b1, b2) => b1.score - b2.score)[0];
            if (newBasket.score > lowestScoringBasket.score) {
                // Replace the lowest scoring basket with the new basket
                potentialBaskets.set(newBasket.totalCost, [...existingBaskets.filter(b => b !== lowestScoringBasket), newBasket]);
            }
        } else {
            let existing = potentialBaskets.get(newBasket.totalCost) ?? []
            potentialBaskets.set(newBasket.totalCost, [...existing, newBasket]);
        }
    }
}