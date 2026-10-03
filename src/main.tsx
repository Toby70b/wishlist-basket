import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';

// TODO(Toby): wrap <App /> in QueryClientProvider and the WishlistSource context provider
// once useWishlist uses them.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
