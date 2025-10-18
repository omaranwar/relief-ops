import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    // skip type-checking (Vite will still build and bundle fine)
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
})
