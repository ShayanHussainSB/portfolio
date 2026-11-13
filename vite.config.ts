import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  resolve: {
    alias: [
      // bunway's package `exports` only exposes its root, which pulls in Bun/Node-only modules.
      // Sheet 03 imports single middleware files (browser-safe ones) straight from the package.
      // kaput (Sheet 05) imports node's http/https/net at load; the browser gets inert stand-ins
      { find: /^(http|https|net)$/, replacement: decodeURIComponent(new URL('./src/lib/node-stub.ts', import.meta.url).pathname) },
      { find: /^bunway\/middleware\/(.+)$/, replacement: decodeURIComponent(new URL('./node_modules/bunway/middleware/', import.meta.url).pathname) + '$1.js' },
    ],
  },
  plugins: [
    react(),
    {
      // `vite dev` has no Vercel edge; mock /api/whoami so the Observation card is exercised locally.
      name: 'dev-whoami',
      configureServer(server) {
        server.middlewares.use('/api/whoami', (_req, res) => {
          res.setHeader('content-type', 'application/json')
          // jittery on purpose, so Sheet 01's conditions readout is exercised locally
          setTimeout(() => res.end(JSON.stringify({ id: 'DEV0', region: 'dev1', city: 'Localhost', country: 'PK' })), 30 + Math.random() * 30)
        })
      },
    },
  ],
})
