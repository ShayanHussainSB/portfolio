// Inject the server-rendered app into dist/index.html so the first paint
// (and no-JS visitors, and crawlers) get real content. Runs after both builds.
import { readFile, rm, writeFile } from 'node:fs/promises'

const ssrDir = new URL('../dist-ssr/', import.meta.url)
const htmlPath = new URL('../dist/index.html', import.meta.url)

const { render } = await import(new URL('entry-server.js', ssrDir).href)
const template = await readFile(htmlPath, 'utf8')
if (!template.includes('<!--app-->')) throw new Error('prerender: <!--app--> marker missing in dist/index.html')

await writeFile(htmlPath, template.replace('<!--app-->', render()))
await rm(ssrDir, { recursive: true, force: true })
console.log('prerender: dist/index.html written')
