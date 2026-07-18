import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project site: https://ryantsai0119.github.io/EasyChess0119/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/EasyChess0119/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
  server: {
    host: true,
    allowedHosts: true,
    headers: {
      // Helpful if later switching to multi-threaded Stockfish
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
})
