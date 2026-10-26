/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Where `npm run dev` forwards /api/*: Steam, unless STEAM_API_URL points elsewhere (e.g. the
  // deployed CloudFront, to test it). Steam sends no CORS headers, so the browser can't call it
  // directly; this proxy calls it server-side. In production CloudFront does the same job.
  // Not used by `npm run dev:mock`, whose mock adapter never calls /api.
  const steamApiUrl = env.STEAM_API_URL || 'https://api.steampowered.com'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: steamApiUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    test: {
      include: ['tests/**/*.test.ts'],
    },
  }
})
