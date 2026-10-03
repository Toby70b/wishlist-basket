const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

/** All money is integer pence; format only at display time. */
export function formatPence(pence: number): string {
  return gbp.format(pence / 100);
}

export function formatScore(score: number): string {
  return score.toFixed(2);
}
