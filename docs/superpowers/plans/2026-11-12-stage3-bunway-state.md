# Stage 3: bunWay Films, Honeycomb Merkle Root Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Sheet 03 (bunWay) and Sheet 04 (State: Honeycomb, with GameShift as a side note).
- On Sheet 03, the visitor toggles the real bunWay middleware and watches the live response headers change.
- On Sheet 04, the visitor picks any of 4,096 leaves and verifies it against a Keccak-256 Merkle root computed in their browser, using 12 hashes instead of 4,096.

**Architecture:** Same pattern as Stage 2. Each sheet is a `StopSheet` with one interactive panel that works on every tier. The 3D map follows through `focusFor(3)` and `focusFor(4)`, which need no new code. The logic lives in pure, tested modules: `lib/films.ts` and `lib/merkle.ts`.

**Tech Stack:** Stage 2's stack, plus:
- `bunway@1.1.0` (deep-imported per middleware file, via a Vite alias)
- `@noble/hashes@2.4.0` (`keccak_256` only)

**Spec:** `docs/design.md` §3 stops 03–04 and §4 items 7–8. Shayan's rulings from 2026-11-12:
- Keccak-256, matching Solana concurrent Merkle trees.
- Only the 4 bunWay layers that run for real in a browser.
- SDK languages: TypeScript, Rust and Python. The 4th is not yet supplied.
- Build straight through after planning.

## Global Constraints

- **Everything in the Stage 1 and Stage 2 plans still applies.** That includes the copy budget, no eyebrow labels, `--fault` / `--fault-ink`, `.sheet` panels, and the full verification matrix (1440×900 and 390×844, light and dark, `?tier=high` and `static`, reduced motion, keyboard).
- **Truth:**
  - **bunWay layers** are the published files, unmodified: `cors`, `helmet`, `requestId`, `responseTime`. No logger or session, because they need Bun I/O or Node crypto.
  - **bunWay facts:** 26 middleware, 0 dependencies, 2,423 tests (PRODUCT.md).
  - **The code line** is the README's own diff: `const express = require("express")` → `import { bunway } from "bunway"`.
  - **Merkle leaves** are 4,096 example records generated in the browser, labelled as examples. Never call them Honeycomb data.
  - **Hashing:** `leaf = keccak256(utf8(record))` and `node = keccak256(left ‖ right)`, the same as spl-account-compression. Say so in the pull-out.
  - **The ×1000 figure:** the before/after numbers are still missing, so show a labelled placeholder and nothing that looks like a measured number.
  - **SDK fan-out:** draw branches from `content.stops.state.sdks`, currently `['TypeScript', 'Rust', 'Python']` with a TODO for the 4th. Show no fake generated code.

## Review Focus

1. **`crypto.randomUUID` is missing** (an insecure context, or older Safari) and requestId throws. The chain must not crash the sheet: that layer shows an error line, and the others still run. → Task 1 test.
2. **Every layer is off.** The response is just the status line, with no crash and no empty-state confusion. → Task 1 test.
3. **The leaf index comes from the range input as a string, or is out of range.** It is clamped to an integer from 0 to 4095. → Task 2 test (`proofFor` clamps).
4. **Tampered leaf.** Verification must FAIL, and the UI must show the fault in three steps, never a false pass. → Task 2 test.
5. **Building the tree blocks the main thread on a weak phone.** It builds once, the first time the sheet is in view, and never at load or during SSR. Hydration still shows "condensing…". → Task 3 check, measuring the build time in a browser.

---

### Task 1: Sheet 03, bunWay films

**Files:**
- Run: `bun add bunway@1.1.0 --exact`
- Modify: `vite.config.ts`
  - Add the alias `{ find: /^bunway\/middleware\/(.+)$/, replacement: <abs>/node_modules/bunway/middleware/$1.js }`, because bunway's `exports` only exposes `.`.
  - Add the matching `vitest` resolution, which shares the Vite config.
- Create: `src/lib/films.ts`, `src/lib/films.test.ts`
- Create: `src/components/BunwayStop.tsx`
- Modify: `content.ts` (`stops.bunway`), `App.tsx`, `app.css`

**Interfaces:**
- `type Layer = 'cors' | 'helmet' | 'requestId' | 'responseTime'`
- `LAYERS: Layer[]` (in that order)
- `runChain(on: Record<Layer, boolean>, origin: string): { headers: [string, string][]; errors: Partial<Record<Layer, string>> }`
  - Builds a fake `req` (`get(name)`, case-insensitive, with `origin` and `method: 'GET'`) and a fake `res` (`set`, `get`, `toResponse`).
  - Runs the enabled layers in order, then calls `res.toResponse()`, so responseTime stamps its header.
  - A throwing layer records `errors[layer]` and the chain continues.

- [ ] **Step 1: Write the failing tests.**
  - All on → the headers include `Access-Control-Allow-Origin: *`, a `Content-Security-Policy`, `X-Frame-Options: SAMEORIGIN`, `X-Request-Id` matching the UUID regex, and `X-Response-Time` matching `/^\d+\.\d{3}ms$/`.
  - `cors` off → no `Access-Control-Allow-Origin`.
  - `helmet` off → no `Content-Security-Policy`.
  - All off → `headers` is empty and `errors` is empty.
  - With `crypto.randomUUID` stubbed to throw → `errors.requestId` is set, and the cors and helmet headers are still present.
- [ ] **Step 2:** Run `bunx vitest run src/lib/films.test.ts`. Expected: FAIL (the module is missing).
- [ ] **Step 3: Implement `films.ts`** by importing each middleware from `bunway/middleware/<name>`.
- [ ] **Step 4:** Run the tests again. Expected: PASS.
- [ ] **Step 5: Build `BunwayStop`.**
  - Four native checkboxes, styled as stacked thin films. Each shows a layer name and how many headers it adds; an off film is dashed, per line notation.
  - Beside them, a live response preview. When a toggle removes headers, they stay one render as struck-through hairline lines, then disappear.
  - `aria-live` announces "cors off: 1 header removed".
  - **Code line:** the two-line README diff.
  - **Pull-out:** 26 middleware, 0 dependencies, 2,423 tests, and why logger and session aren't in the tab.
- [ ] **Step 6: Visual and keyboard check.**
  - Space toggles each film.
  - Check desktop and phone, both themes, and reduced motion.

### Task 2: Merkle core (Keccak-256)

**Files:**
- Run: `bun add @noble/hashes@2.4.0 --exact`
- Create: `src/lib/merkle.ts`, `src/lib/merkle.test.ts`

**Interfaces:**
- `DEPTH = 12` and `LEAVES = 4096`
- `record(i: number): string` → `` `record #${i}` ``. It's an example record, and is labelled that way in the UI.
- `buildTree(leaves: Uint8Array[]): Uint8Array[][]`: `levels[0]` holds the leaf hashes and `levels[DEPTH]` is `[root]`.
- `proofFor(levels, index: number | string): { index: number; siblings: Uint8Array[] }`: the index is clamped to an integer from 0 to LEAVES−1.
- `verify(leafData: string, index: number, siblings: Uint8Array[], root: Uint8Array): { ok: boolean; hashes: number }`
- `hex(b: Uint8Array, n?: number): string`

- [ ] **Step 1: Write the failing tests:**
  - `hex(keccak_256(new Uint8Array()))` = `c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470` (a known answer, which proves this is Keccak and not SHA3-256).
  - For a 2-leaf tree, the root = `keccak256(keccak256("a") ‖ keccak256("b"))`.
  - For the full 4,096-leaf tree:
    - `levels.length === 13`
    - `proofFor(levels, 2731).siblings.length === 12`
    - `verify(record(2731), 2731, siblings, root)` → `{ ok: true, hashes: 13 }` (1 leaf hash plus 12 nodes)
    - The tampered `record(2731) + ' '` gives `ok: false`.
    - The proof for 2731 checked against index 2730 gives `ok: false`.
  - `proofFor(levels, '9999').index === 4095` and `proofFor(levels, -3).index === 0`.
- [ ] **Step 2:** Run `bunx vitest run src/lib/merkle.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `merkle.ts`.**
- [ ] **Step 4:** Run the tests again. Expected: PASS.

### Task 3: Sheet 04, State (Merkle root, SDK fan-out, GameShift)

**Files:**
- Create: `src/components/StateStop.tsx`
- Modify: `content.ts` (`stops.state`), `App.tsx`, `app.css`

**Interfaces:** consumes `buildTree`, `proofFor`, `verify`, `record`, `hex` and `LEAVES` from Task 2.

- [ ] **Step 1: Build `StateStop`.**
  - **Tree build:** the tree is built the first time the sheet is 25% visible. Until then it shows "condensing 4,096 records…". The build time is measured with `performance.now()` and shown, because it's real.
  - **Leaf field:** a `<canvas>` of 64×64 cells, one per leaf, sized by CSS. Clicking a cell selects that leaf. The canvas is `aria-hidden`.
  - **Keyboard and thumbs:** a native `<input type="range" min=0 max=4095>` is the accessible control.
  - **Proof ladder:** an SVG with 12 rungs, from the leaf up to the root crystal. Each rung shows the sibling hash (`hex(…, 4)`, mono), and the visitor's path is drawn in the fringe.
  - **Result:** "Verified with 13 hashes, not 4,096." (the copy counts the leaf hash honestly). A "Tamper with this record" toggle flips verification to a fault: a hatched ladder, then a `--fault` cut at the root, then the `--fault-ink` result line.
  - **Below:** the SDK fan-out (`schema.graphql` → one branch per `sdks` entry, with no code) and a one-line GameShift side note.
  - **×1000:** a labelled placeholder in the pull-out only.
- [ ] **Step 2: Check it in a browser.**
  - Record the build time on desktop, and on a 4× CPU-throttled run via puppeteer `emulateCPUThrottling(4)`.
  - Clicking a leaf, using the range keys, tampering, and untampering all work.
  - Check desktop and phone, both themes, reduced motion, and `?tier=high` (the camera reaches BUNWAY, then STATE).

### Task 4: Finish the stage

- [ ] **Step 1:** Run `bun run test && bun run typecheck && bun run build`. All three must pass, and `dist/index.html` must contain both new headlines.
- [ ] **Step 2: Full visual pass.** Run the matrix and the impeccable detector against the dev URL, then do a keyboard Tab pass.
- [ ] **Step 3: Update the docs.**
  - README: journey notes for Sheets 03 and 04, plus knobs.
  - `docs/design.md`: correct stops 03 and 04 (the real layers, Keccak, 13 hashes).
  - Write the ledger.
