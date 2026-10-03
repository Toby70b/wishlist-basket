export type Game = {
  appId: number;
  name: string;
  price: number; // final price in pence, after any current discount
  originalPrice: number; // pence, before discount
  discountPercent: number; // 0–100
  rank: number; // wishlist position, 1 = top
};
