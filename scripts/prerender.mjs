// Inject the server-rendered app into dist/index.html so the first paint
// (and no-JS visitors, and crawlers) get real content. Runs after both builds.
import { readdir, readFile, rm, writeFile } from 'node:fs/promises'

const ssrDir = new URL('../dist-ssr/', import.meta.url)
const htmlPath = new URL('../dist/index.html', import.meta.url)

const { render } = await import(new URL('entry-server.js', ssrDir).href)
const template = await readFile(htmlPath, 'utf8')
if (!template.includes('<!--app-->')) throw new Error('prerender: <!--app--> marker missing in dist/index.html')

// Preload the Latin display face so the hero headline doesn't wait on the CSS to discover it.
const font = (await readdir(new URL('../dist/assets/', import.meta.url))).find((f) => /^archivo-latin-wdth-normal-.*\.woff2$/.test(f))
const preload = font ? `<link rel="preload" href="/assets/${font}" as="font" type="font/woff2" crossorigin />\n  ` : ''

await writeFile(htmlPath, template.replace('</head>', `${preload}</head>`).replace('<!--app-->', render()))
await rm(ssrDir, { recursive: true, force: true })
console.log('prerender: dist/index.html written')
