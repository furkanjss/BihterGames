import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  base: '/studio/',
  build: {
    outDir: '../dist/studio',
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    host: true,
  },
})
