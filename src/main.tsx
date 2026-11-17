import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './components/App';
import { WishlistSourceProvider } from './hooks/WishlistSourceContext';
import { SteamProxyWishlistSource } from './adapters/SteamProxyWishlistSource';
import type { WishlistSource } from './ports/WishlistSource';

// The mock is loaded with import() inside the DEV check, never a top-level import: in a
// production build DEV is false, so the bundler drops this branch and the mock (and its
// wishlist data) never reaches dist/.
async function createWishlistSource(): Promise<WishlistSource> {
  if (import.meta.env.DEV && import.meta.env.VITE_MOCK_WISHLIST_API === 'true') {
    const { MockWishlistSource } = await import('./adapters/MockWishlistSource');
    return new MockWishlistSource();
  }
  return new SteamProxyWishlistSource('/api');
}

// Composition root: the only file that knows which adapter is real.
// /api goes to the Vite dev proxy locally, and through CloudFront and the Lambda proxy in production.
const wishlistSource = await createWishlistSource();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 60 * 1000, // one fetch per Steam ID per hour; prices rarely change faster
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
