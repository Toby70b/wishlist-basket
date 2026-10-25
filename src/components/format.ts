const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

/** All money is integer pence; format only at display time. */
export function formatPence(pence: number): string {
  return gbp.format(pence / 100);
}

const wholeNumber = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });

/** Scores are whole numbers (N + 1 - rank per game), e.g. 1,858. */
export function formatScore(score: number): string {
  return wholeNumber.format(score);
}
