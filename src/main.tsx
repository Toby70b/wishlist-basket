import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './components/App';
import { WishlistSourceProvider } from './hooks/WishlistSourceContext';
import { SteamProxyWishlistSource } from './adapters/SteamProxyWishlistSource';
import type { WishlistSource } from './ports/WishlistSource';

// The mock is loaded with import() inside the DEV check, never a top-level import: in a
// production build DEV is false, so the bundler drops this branch and the mock (and its
// wishlist data) never reaches dist/. A top-level import kept the data in the bundle.
async function createWishlistSource(): Promise<WishlistSource> {
  if (import.meta.env.DEV && import.meta.env.VITE_MOCK_WISHLIST_API === 'true') {
    const { MockWishlistSource } = await import('./adapters/MockWishlistSource');
    return new MockWishlistSource();
  }
  return new SteamProxyWishlistSource('/api');
}

// Composition root: the only file that knows which adapter is real.
// /api goes to the Vite dev proxy locally, and through CloudFront to Steam in production.
const wishlistSource = await createWishlistSource();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 60 * 1000, // prices are cached ~1 hour upstream; don't refetch sooner
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <WishlistSourceProvider value={wishlistSource}>
        <App />
      </WishlistSourceProvider>
    </QueryClientProvider>
  </StrictMode>,
);
