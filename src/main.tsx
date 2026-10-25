import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './components/App';
import { WishlistSourceProvider } from './hooks/WishlistSourceContext';
import { SteamProxyWishlistSource } from './adapters/SteamProxyWishlistSource';
import {MockWishlistSource} from "./adapters/MockWishlistSource.ts";


const createWishlistSource = () => {
    if (import.meta.env.DEV && import.meta.env.VITE_MOCK_WISHLIST_API === 'true') {
      return new MockWishlistSource()
    }
    else {
      return new SteamProxyWishlistSource('/api')
    }
}


// Composition root: the only file that knows which adapter is real.
// /api goes to the dev proxy (WireMock or Steam, see STEAM_API_URL) locally, and to the
// Lambda via CloudFront in production.
const wishlistSource = createWishlistSource();

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
