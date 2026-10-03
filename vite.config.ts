/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Where `npm run dev` sends /api/* — WireMock locally, or real Steam if unset.
  // In production CloudFront sends /api/* to the Lambda proxy instead.
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
