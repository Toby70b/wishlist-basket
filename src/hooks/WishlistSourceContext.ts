import { createContext, useContext } from 'react';
import type { WishlistSource } from '../ports/WishlistSource';

const WishlistSourceContext = createContext<WishlistSource | null>(null);

/** Plugs a WishlistSource adapter into the app. main.tsx picks which one. */
export const WishlistSourceProvider = WishlistSourceContext.Provider;

/** The plugged-in WishlistSource. Hooks use this instead of importing an adapter. */
export function useWishlistSource(): WishlistSource {
  const source = useContext(WishlistSourceContext);
  if (!source) throw new Error('useWishlistSource must be used inside <WishlistSourceProvider>');
  return source;
}
