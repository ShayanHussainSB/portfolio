# Chain Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A pinned section after About that flies the visitor forward through Shayan's Solana history as a hash-linked chain of blocks, with NFT art as hero imagery.

**Architecture:** `lib/chain.ts` links plain block content into real Keccak-chained blocks. `ChainJourney.tsx` renders them as an `<ol>` inside a sticky stage; `useProgressVar` drives `--p`, and CSS turns `--p` and each block's `--i` into depth (`translateZ`) and opacity. One small effect scrambles the current block's hash while it "mines".

**Tech Stack:** React 19, Vite, plain CSS in `src/styles/site.css`, `@noble/hashes` (already installed), vitest.

**Spec:** `docs/superpowers/specs/2026-11-13-chain-journey-design.md`

## Global Constraints

- No new dependencies. No WebGL.
- Every word lives in `src/content.ts`. Claims stay true: the role line for every collection is exactly "Smart contracts in Anchor/Rust. Full stack in GraphQL, Node, React."
- Do not add "aps" or any collection Shayan did not name.
- No resume link (resumes are gitignored). The head block CTA uses `ctaHref` and `content.person.linkedin`.
- Hash rule: `hash_i = keccak256(prev_i ‖ utf8(year + ' ' + headline))`, with `prev_0` = 32 zero bytes.
- `prefers-reduced-motion: reduce` means no pin, a flat list, and settled hashes.
- No horizontal page scroll at 360px width.

## Review Focus

1. **Scrolling up into the section** (from the projects back up): blocks must reverse cleanly with no stuck layers. Recent commit 16d6a2d fixed exactly this for `.scene`, so don't add `will-change` to scaled/translated layers (see the comment at `site.css:372`). Check by hand in Task 3, step 6.
2. **Reduced motion:** every block is visible and readable, with no zero-opacity blocks. Covered by Task 3, step 6.
3. **SSR prerender:** `bun run build` must succeed, and `dist/index.html` must contain every headline and hash (the hashes are computed at import, not in an effect). Covered by Task 3, step 5.
4. **Image fails to load:** the block still reads, because the art sits in a fixed-aspect box with the `--ground` background and the alt text. Covered by the CSS in Task 3.
5. **Narrow screens (360px):** the art is at most 70vw and the headline wraps, with no overflow. Covered by Task 3, step 6.

---

### Task 1: Hash-linked blocks (`lib/chain.ts`)

**Files:**
- Create: `src/lib/chain.ts`
- Test: `src/lib/chain.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface Block { year: string; headline: string; line: string; art?: string; alt?: string; href?: string; cta?: boolean }
  export interface Linked extends Block { height: number; hash: string; prev: string } // hash/prev: 64-char lowercase hex
  export function link(blocks: readonly Block[]): Linked[]
  export function short(hex: string): string // '0x' + first 4 + '…' + last 4
  ```

- [ ] **Step 1: Write the failing tests** in `src/lib/chain.test.ts`:
  - `link([a, b])[0].prev === '0'.repeat(64)` and `.height === 0`
  - `link([a, b])[1].prev === link([a, b])[0].hash`
  - `link([a])[0].hash === bytesToHex(keccak_256(concat(new Uint8Array(32), utf8('2022 Sol Patrol.'))))` for `a = { year: '2022', headline: 'Sol Patrol.', line: '' }`
  - changing `a.headline` changes both `[0].hash` and `[1].hash`; changing `a.line` changes neither (only the year and headline are hashed)
  - `short('ab12' + '0'.repeat(56) + 'cd34') === '0xab12…cd34'`
- [ ] **Step 2:** Run `bun run test src/lib/chain.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement `link` and `short` in `src/lib/chain.ts`. Import `keccak_256`/`bytesToHex` exactly as `lib/merkle.ts` does.
- [ ] **Step 4:** Run `bun run test src/lib/chain.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit** `git add src/lib/chain.* && git commit -m "Add hash-linked chain blocks"`

### Task 2: Content and NFT art

**Files:**
- Modify: `src/content.ts` (add `chain` after `stops`; LinkedIn is already `content.person.linkedin`)
- Create: `src/assets/photos/chain-{solpatrol,fracture,bonk,madlads}-{600,1000}.{avif,webp,jpg}`
- Modify: `README.md` Photos table (one row per image: name, source URL, "Chain journey")

**Interfaces:**
- Produces: `content.chain = { title: string, kicker: string, cta: string, blocks: Block[] }`, where `Block` is from `lib/chain.ts` and `art` is a photo name for `srcSet()` (e.g. `'chain-madlads'`).

- [ ] **Step 1: Fetch the originals into a fresh untrusted dir** `photos-original/chain/` (gitignored). Collection cover images come from Magic Eden: `curl -s https://api-mainnet.magiceden.dev/v2/collections/<symbol>` → `.image`. Try the symbols `sol_patrol`, `mad_lads` and `bridged` (The Fracture's faction; also try `the_fracture`). BONK's logo comes from the Jupiter token API: `curl -s https://lite-api.jup.ag/tokens/v2/search?query=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263` → `logoURI`. Download each image and **view each with the Read tool** before using it. If a symbol is wrong or an image looks off, don't guess: leave that block's `art` unset and report it.
- [ ] **Step 2: Make the web sizes** with the README's `cwebp` + `sips` commands (square crop, widths 600 and 1000).
- [ ] **Step 3: Add `content.chain`.** Copy, verbatim:
  - title: `'Four years on Solana.'` · kicker: `'The chain so far'` · cta: `'Ask me about any block'`
  - blocks, in order (role = `'Smart contracts in Anchor/Rust. Full stack in GraphQL, Node, React.'`):
    0. `2020` · `Genesis.` · `Freelance backends: a trading engine across 5+ exchanges, game servers under 50 ms.`
    1. `2022` · `Sol Patrol. NFTs, raffles, staking.` · `Where Honeycomb began. ` + role · art `chain-solpatrol`
    2. `2022` · `The Fracture.` · role · art `chain-fracture`. Comment: `// TODO(Shayan): year inferred from Yawww/Hadeswap listings; confirm.`
    3. `2022` · `BONK.` · role · art `chain-bonk`
    4. `2023` · `Mad Lads.` · role · art `chain-madlads`
    5. `2022–26` · `Games, on-chain.` · `Honeycomb: profiles, characters, missions and staking behind one API.`
    6. `2023` · `1000× cheaper state.` · `Compressed accounts on the SVM: Borsh, zero-copy, Merkle roots.` · href `#all-state`
    7. `2023` · `Sandstorm. Grizzlython. Civic.` · `Three hackathon wins.`
    8. `now` · `Head.` · `10+ programs on mainnet. Zero security incidents.` · `cta: true`
  - alt for each art: `'<Collection> artwork, from the collection’s public listing.'`
- [ ] **Step 4:** Run `bun run typecheck`. Expected: no errors.
- [ ] **Step 5: Commit** the content, the images and the README row.

### Task 3: `ChainJourney` section

**Files:**
- Create: `src/components/ChainJourney.tsx`
- Modify: `src/App.tsx` (render `<ChainJourney ctaHref={ctaHref} />` between `<EdgeStop …/>` and `<div className="work">`)
- Modify: `src/styles/site.css` (new `/* ---------- chain journey ---------- */` block after the scene rules, plus a reduced-motion block inside the existing `@media (prefers-reduced-motion: reduce)` at line ~553)

**Interfaces:**
- Consumes: `link`, `short` (Task 1); `content.chain` (Task 2); `useProgressVar`, `progress` from `lib/scroll.ts`; `srcSet`, `fallbackSrc` from `lib/photos.ts`.
- Produces: `export function ChainJourney({ ctaHref }: { ctaHref: string })`

- [ ] **Step 1: Markup.** `<section className="chain" id="chain" aria-labelledby="chain-title">` → `.chain__pin` (ref, `style={{'--n': blocks.length}}`) → `.chain__stage` (sticky) → `<h2 id="chain-title">` (kicker + title) and `<ol className="chain__blocks">`, with one `<li className="block" style={{'--i': i}} data-current={i === cur}>` per linked block. Each block holds: a `.block__meta` line (`#height · year`, plus `hash`/`prev` via `short()`, `aria-hidden`), an `.sr-only` "Block {n} of {total}, {year}", `<h3>` headline, `<p>` line, the art as a `<picture>` using the photo helpers (`loading="lazy"`), a link when `href` is set, and on `cta` a link to `ctaHref` (text `content.chain.cta`) plus LinkedIn. `const chain = link(content.chain.blocks)` at module level.
- [ ] **Step 2: Current block and mining.** A scroll/resize rAF listener (same shape as `useProgressVar`) sets `cur = Math.round(progress(pin) * (n - 1))`; React bails out when it's unchanged. While `data-current` is on, the hash text scrambles: every 40 ms for 400 ms, replace each hex char with a random hex char, then set the real `short(hash)`. Skip the scramble when `matchMedia('(prefers-reduced-motion: reduce)').matches`. SSR renders the real hash.
- [ ] **Step 3: Depth CSS.** These values decide the look; tune by eye only after it works:
  ```css
  .chain__pin { --p: 0; height: calc((var(--n) + 1) * 90svh); }
  .chain__stage { position: sticky; top: 0; height: 100svh; overflow: hidden; perspective: 1000px; background: var(--ground); color: var(--paper); }
  .chain__blocks { position: absolute; inset: 0; transform-style: preserve-3d; }
  .block { --d: calc(var(--p) * (var(--n) - 1) - var(--i)); /* <0 ahead, 0 at the front, >0 passed */
    position: absolute; inset: 0; margin: auto; width: min(92vw, 1100px); height: fit-content;
    transform: translateZ(calc(var(--d) * 1100px));
    /* fade in from far, out as it passes the camera */
    opacity: min(clamp(0, calc(1 + var(--d) * 0.55), 1), clamp(0, calc(1 - var(--d) * 3.2), 1)); }
  ```
  The block is laid out as two columns (art | words) at ≥ 760px and stacked below that, with art `max-width: 70vw; aspect-ratio: 1`. The section accent is `--chain-grad: linear-gradient(90deg, #9945ff, #14f195)` (Solana's gradient, distinct from every `--hue-*`), used as the block's 3px top border via `border-image` and as the connector: a `.block::after` line under the current block, `scale: calc(...)` from `--d` toward the next. **No `will-change`.** Passed blocks get `pointer-events: none` via `data-current` (only the current block is clickable).
- [ ] **Step 4: Reduced motion** (inside the existing reduce media block): `.chain__pin { height: auto }`, `.chain__stage { position: relative; height: auto; perspective: none; overflow: visible }`, `.chain__blocks { position: static }`, `.block { position: relative; inset: auto; transform: none; opacity: 1; margin: 0 auto 12vh }`.
- [ ] **Step 5: Verify the build.** Run `bun run typecheck && bun run test && bun run build`, then `grep -c "Mad Lads." dist/index.html` (expect ≥ 1) and `grep -o "0x[0-9a-f]\{4\}…" dist/index.html | head` (expect hashes present). Expected: all green.
- [ ] **Step 6: Verify in the browser** (`bun run dev`, Chrome) at 1440×900 and 360×780: scroll down through all 9 blocks, then back up from the projects to the top of the section (no stuck or blank blocks), and with DevTools "Emulate prefers-reduced-motion: reduce" check that all blocks are visible and flat. Also: no horizontal scrollbar at 360px; the `#all-state` link opens the Honeycomb sheet; the console is clean. Record a GIF of the scroll for Shayan.
- [ ] **Step 7: Commit** `git add src/components/ChainJourney.tsx src/App.tsx src/styles/site.css && git commit -m "Add chain journey section"`
