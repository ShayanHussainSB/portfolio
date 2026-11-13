import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './styles/site.css'
import { App } from './App'
import { bf, CHEEKY } from './lib/bf'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Production HTML is prerendered (hydrate); `vite dev` serves an empty root (render).
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)

// For whoever opens DevTools: a function on window, written in Brainfuck. Printing it shows the program; calling it runs it.
const tag = 'font: 12px ui-monospace, monospace;'
Object.assign(window, {
  cheeky: Object.assign(() => console.log(`%c${bf(CHEEKY)}`, `${tag} font-size: 22px; font-weight: 800; color: #dfff4f; background: #07070a; padding: 8px 14px;`), { toString: () => CHEEKY }),
})
console.log(
  `%cLooking under the hood?%c\n\nThere is a function on window called cheeky. I wrote it in the one language nobody asks me to review:\n\n%c${CHEEKY.replace(/(.{64})/g, '$1\n')}%c\n\nRun cheeky() to see what it says. Or press \` on the page for a terminal, and ssh guest@shayan.`,
  `${tag} font-size: 15px; font-weight: 800;`,
  tag,
  `${tag} color: #b688ff;`,
  tag,
)
