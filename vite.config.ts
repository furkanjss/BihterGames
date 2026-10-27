import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/** Serve public/*/index.html for clean directory URLs in dev (Vercel does this in prod). */
function publicDirIndex(dirs: string[]): Plugin {
  return {
    name: 'public-dir-index',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const path = req.url?.split('?')[0] ?? ''
        for (const dir of dirs) {
          if (path === `/${dir}` || path === `/${dir}/`) {
            req.url = `/${dir}/index.html`
            break
          }
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), publicDirIndex(['frostline-gdd', 'publisherpitch'])],
})

