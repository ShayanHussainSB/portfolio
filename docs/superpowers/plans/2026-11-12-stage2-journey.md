# Stage 2: Scroll Journey, Edge, hitlimit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The visitor scrolls from the hero into Sheet 01 (Edge/About) and Sheet 02 (hitlimit). The 3D map's camera and request ribbon follow stop by stop. Each stop runs a real system: live edge pings, the real `@joint-ops/hitlimit` middleware, and a Worker benchmark.

**Architecture:**
- On desktop, the lazy R3F scene moves out of the hero into a sticky map layer that spans the journey. On phones it stays in the hero, as now.
- An IntersectionObserver picks the active stop. A pure `focusFor(stop)` gives the camera target, and `reachedFor(stop)` drives `RequestRibbon`'s `reachedIndex`.
- Every interaction is one accessible SVG/DOM panel that works on every tier (Shayan's ruling: "SVG panels, 3D as map"). The 3D layer only follows along.

**Tech Stack:** Stage 1's stack, plus `@joint-ops/hitlimit@1.5.0` (zero-dependency core, ~8 KB, runs in the browser). No gsap: the camera eases the same way the ribbon already does.

**Spec:** `docs/design.md` §3 stops 01–02, §4 items 5–6, §5. Direction: `.impeccable/surfaces/index-html.md`. Facts: `PRODUCT.md`.

## Global Constraints

- **Everything from the Stage 1 plan still applies:** tokens, night edge, type, the banned list, content in `src/content.ts`, AA contrast, readable with no JS or WebGL, and no commits (the ledger replaces commits).
- **Truth rulings (2026-11-12):**
  - hitlimit 1.5.0 is a **fixed-window counter**, not a token bucket. The vessel drains one droplet per request and refills all at once when the window resets.
  - "Slow down cowboy!" is passed through hitlimit's real `response` option. The site shows that exact config as its line of code.
- **Copy budget per stop:** one headline, one sentence and one highlighted line of real code. Everything else goes in a native `<details>` pull-out.
- **No eyebrow labels.** The sheet number lives in a title-block strip at the bottom of each stop, never above a heading.
- **Line notation:** solid fringe = taken, dashed = not yet taken, hatched = sealed. The fringe appears only on the visitor's own request: the ribbon, the visitor's droplets, and the visitor's ping marks.
- **`--fault`** is used only for 429 escalation: a calm slate status, then a hatched border on the vessel, then a full `--fault` status line.
- **Every stop needs:**
  - a reduced-motion version (instant state changes, no camera flight)
  - keyboard operation
  - `aria-live="polite"` announcements
  - a 390px layout with controls in the thumb zone
- **Photos:** only `src/assets/photos/portrait-*` ships. Never touch `photos-original/`.
- **Contact email is confirmed** as `shayanhussain48@gmail.com`: remove the TODO in `content.ts`. The Honeycomb figures, CV and testimonials stay labelled placeholders.
- **Verify** at 1440×900 and 390×844, light and dark, with `?tier=high` for 3D and also with reduced motion. Use Claude in Chrome if it's connected, otherwise puppeteer-core in the scratchpad driving `/Applications/Google Chrome.app` headless.

## Review Focus

1. **The edge can't be reached during the pings** (ad-blocker, offline, `vite preview`). The readout says "conditions unknown" and invents no numbers. The ribbon keeps its default shimmer. → Task 2 test.
2. **Spam: held Enter (key repeat), or 100 fast taps.** Every press goes through the real limiter. The rejected pile is drawn up to a cap, with a "+N" count beyond it, so the DOM can't grow without limit. → Task 3 test.
3. **The window resets while the tab is hidden.** On return the vessel is full and the countdown is gone. State comes from `Date.now()`, never from counting timer ticks. → Task 3 test.
4. **The benchmark is clicked twice, Workers are unavailable, or the device is weak.** It never runs automatically, and the button is disabled while a run is in flight. If the Worker fails, the visitor sees an honest "couldn't run here" line. → Task 4 test plus a manual check.
5. **SSR and fast scrolling.** The stops prerender with their full text (no `window` during SSR). Jumping between stops by keyboard or anchor never leaves the ribbon stuck on an old stop. → Task 1 test plus a build check.

---

### Task 1: Journey spine (sticky map, active stop, stop shell)

**Files:**
- Modify: `src/scene/topology.ts`
  - move `FRAMING` here from `Scene.tsx`
  - add `focusFor` and `reachedFor`
- Modify: `src/scene/topology.test.ts`
- Modify: `src/scene/Scene.tsx`
  - new prop `stop`
  - the Rig eases the group offset and camera z toward `focusFor`
  - the ribbon gets `reachedIndex={reachedFor(stop)}`
- Modify: `src/App.tsx`
  - wrap the hero and the stops in `<div className="journey">`
  - on landscape, render the scene in `<div className="map">` (sticky); on portrait, keep it in `Hero`
  - `useActiveStop`
- Create: `src/components/StopSheet.tsx`
  - `<section data-stop={n} aria-labelledby>`
  - slots for the copy, the code line, the panel and the pull-out
  - a title-block strip with the sheet number and a progress rail (one tick per `NODES` entry, fringe up to the stop)
- Modify: `src/content.ts`: add `stops.edge` and `stops.hitlimit` (all copy below), and remove the email TODO
- Modify: `src/styles/app.css`
  - `.journey`, `.map` (sticky, `height:100vh; margin-bottom:-100vh; pointer-events:none`)
  - `.stop` grid: copy in columns 1–5 and the panel in 7–12 on desktop; stacked on phones
  - `.rail`

**Interfaces:**
- Produces:
  - `focusFor(stop: number, o: Orientation): { offset: Vec3; cameraZ: number }`
  - `reachedFor(stop: number): number`
  - `<StopSheet n={number} id={string} headline code sentence panel details>`
  - `useActiveStop(): number`, which lives in `App.tsx` and observes `[data-stop]` with rootMargin `-45% 0px -45% 0px`. The hero is stop 0.

- [ ] **Step 1: Write the failing tests** in `topology.test.ts`:
  - `focusFor(0, o)` deep-equals `FRAMING[o]` for both orientations.
  - For `k` in 1..`NODES.length`, `focusFor(k,'landscape').offset + place(NODES[k-1].pos)` equals `FOCUS_ANCHOR.landscape` (to 1e-9).
  - `focusFor(99, o)` equals `focusFor(NODES.length, o)` (clamped).
  - `reachedFor(0) === 2`, `reachedFor(1) === 2`, `reachedFor(2) === 3`, and `reachedFor(99) === REQUEST_PATH.length - 1`.
- [ ] **Step 2:** Run `bunx vitest run src/scene/topology.test.ts`. Expected: FAIL (`focusFor` is not exported).
- [ ] **Step 3: Implement both functions.**
  - `FOCUS_ANCHOR: Record<Orientation, Vec3>` and `FOCUS_Z: Record<Orientation, number>` are tuning knobs. Start at landscape `[2.6, 0.2, 0]` and z `9`, then tune by eye in Step 6.
  - `reachedFor = (s) => Math.min(Math.max(2, s + 1), REQUEST_PATH.length - 1)`.
- [ ] **Step 4:** Run the tests again. Expected: PASS.
- [ ] **Step 5: Wire up the scene and the shell.**
  - The Rig eases with `k = 1 - exp(-dt*2.4)`, the same as the ribbon.
  - Under reduced motion there is no canvas, so the stops show only the rail.
  - Keep the Stage 1 IntersectionObserver that pauses the canvas when the map is off-screen; it now watches `.map`.
  - Add the two stops with placeholder panels.
- [ ] **Step 6: Load the impeccable skill and check the stop layout against the contract.** At `?tier=high`, scroll hero → 01 → 02. Check:
  - the camera settles on EDGE, then on HITLIMIT
  - the ribbon's solid fringe extends to HITLIMIT on stop 02
  - the copy is never covered by the 3D
  - Save screenshots at 1440×900 (light and dark) and 390×844.
- [ ] **Step 7: Check the prerender.** Run `bun run build && grep -c "data-stop" dist/index.html`. Expected: `3` (the hero plus two stops). Also check that both stop headlines appear in `dist/index.html`.

### Task 2: Sheet 01, Edge / About

**Files:**
- Create: `src/lib/conditions.ts`, `src/lib/conditions.test.ts`
- Create: `src/components/EdgeStop.tsx`, containing:
  - the portrait figure, with callouts as an SVG overlay (leader lines, dot anchors at percentage coordinates stored in content)
  - the conditions readout
- Modify:
  - `src/scene/RequestRibbon.tsx`: a `shimmer` prop (0..1) scales `uThickness`
  - `Scene.tsx`: passes `shimmer` through
  - `SystemDrawing.tsx`/`app.css`: `--shimmer` sets the `.dw-fringe-wide` stroke-width
  - `vite.config.ts`: the dev mock delay becomes `30 + Math.random()*30` ms, so jitter is exercised locally

**Interfaces:**
- Consumes: `StopSheet`, `content.stops.edge`, and `fetchObservation`'s timing approach (`performance.now()` around `fetch('/api/whoami', {cache:'no-store'})`)
- Produces:
  - `pingEdge(n = 5, fetcher = fetch): Promise<number[] | null>`. Pings run sequentially. A failed ping is skipped. Fewer than 2 good samples returns `null`.
  - `summarize(samples: number[]): { median: number; jitter: number; min: number; max: number }`, where jitter is the mean |Δ| between consecutive samples (RFC 3550 style), rounded to whole ms.
  - `sky(jitterMs: number): 'calm' | 'breezy' | 'gusty'`: under 5 is calm, under 20 is breezy, anything higher is gusty.
  - `shimmerFrom(jitterMs: number): number` = `clamp(jitter/30, 0, 1)`
  - `App` holds `shimmer` state (default `0.3`) and sets it from `EdgeStop`'s `onConditions` callback.

- [ ] **Step 1: Write the failing tests:**
  - `summarize([40,46,41,60,42])` → `{median:42, jitter:12, min:40, max:60}`, since (6+5+19+18)/4 = 12.
  - `summarize([50,50])` gives jitter 0.
  - `sky(4)==='calm'`, `sky(5)==='breezy'`, `sky(20)==='gusty'`.
  - `shimmerFrom(-1)===0`, `shimmerFrom(15)===0.5`, `shimmerFrom(90)===1`.
  - `pingEdge(5, () => Promise.reject(new Error()))` resolves to `null`.
  - With a fetcher that fails every other call, the result has length 2 or 3 and no `NaN`.
  - The fetcher is called 5 times, and never more than once at a time (assert that in-flight never exceeds 1).
- [ ] **Step 2:** Run `bunx vitest run src/lib/conditions.test.ts`. Expected: FAIL (the module is missing).
- [ ] **Step 3: Implement `conditions.ts`.**
- [ ] **Step 4:** Run the tests again. Expected: PASS.
- [ ] **Step 5: Build `EdgeStop`.**
  - The pings start the first time the stop is 25% visible (IntersectionObserver). The server and the first render show "measuring…".
  - The readout uses B612 Mono and reads as one METAR-style line: `EDGE {region} · RTT {median} ms · JITTER {jitter} ms · {sky}`. Below it, a dimension line marks the five samples as ticks in fringe colour.
  - A "Measure again" button re-runs the pings.
  - `aria-live` announces the summary sentence.
  - **Portrait:**
    - `<picture>` built from `srcSet('portrait', …)`
    - the drawing treatment: `filter: grayscale(1) contrast(1.05)`, a hairline frame, and a dimension line along one side
    - 3 callouts from `content.stops.edge.callouts`, each reachable through the figure's `figcaption` text, so nothing is visual-only
  - The bio is three lines.
  - The pull-out explains the method: 5 sequential fetches, `no-store`, and how jitter is defined.
- [ ] **Step 6: Visual check.**
  - Desktop and phone, in both themes. The fringe-wide stroke visibly changes between `?tier=static` runs under the dev mock.
  - With `/api/whoami` blocked (DevTools request blocking or `bun run preview`), the readout says unknown.

### Task 3: Sheet 02, hitlimit (real middleware, vessel, 429)

**Files:**
- Run: `bun add @joint-ops/hitlimit@1.5.0` (pinned exactly)
- Create: `src/lib/limiter.ts`, `src/lib/limiter.test.ts`
- Create: `src/components/HitlimitStop.tsx`, containing:
  - the vessel SVG, with the route line and the rejected pile below it
  - the Send and Send ×10 buttons
  - a live response preview (status line, headers, JSON body)
  - the countdown

**Interfaces:**
- Produces:
  - `LIMIT = 5`, `WINDOW = '10s'`, and `MESSAGE = 'Slow down cowboy!'`
  - `exchange(mw, ip): Exchange`: calls a hitlimit middleware synchronously with a fake `req {ip}` and a fake `res` (`setHeader` coerces to String, `status`, `json`). `next` sets status 200.
  - `interface Exchange { status: 200 | 429; headers: Record<string, string>; body: unknown }`
  - `createLimiter(): (ip?: string) => Exchange` = `hitlimit({ limit: LIMIT, window: WINDOW, response: { message: MESSAGE } })`, with the default ip `'visitor'`
  - `vesselView(s: { remaining: number; resetAtMs: number; rejected: number } | null, now: number, cap = 48): { level: number; retryIn: number; pileDrawn: number; pileExtra: number }`

- [ ] **Step 1: Write the failing tests** (`vi.useFakeTimers()` with a fixed `setSystemTime`):
  - 5 calls → status 200 each, with `headers['RateLimit-Remaining']` going `'4'…'0'`.
  - The 6th call → 429, with `headers['Retry-After'] === '10'` and `body` deep-equal to `{message:'Slow down cowboy!', limit:5, remaining:0, resetIn:10}`.
  - After `vi.advanceTimersByTime(10_000)`, the next call → 200 with remaining `'4'`.
  - `vesselView(null, t)` → `{level:5, retryIn:0, pileDrawn:0, pileExtra:0}`.
  - With `{remaining:0, resetAtMs:t+7000, rejected:3}` at `t` → `{level:0, retryIn:7, pileDrawn:3, pileExtra:0}`. At `t+7000` → level 5, retryIn 0, and the pile stays at 3 (rejected droplets stay).
  - `rejected:100` → `pileDrawn:48, pileExtra:52`.
- [ ] **Step 2:** Run `bunx vitest run src/lib/limiter.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `limiter.ts`.** Read `resetAtMs` from `X-RateLimit-Reset` (epoch seconds) × 1000.
- [ ] **Step 4:** Run the tests again. Expected: PASS. If hitlimit's sweep `setInterval` leaks between tests, call `store.shutdown()` in `afterEach`. Pass an explicit `memoryStore()` so the test can reach it.
- [ ] **Step 5: Build `HitlimitStop`.**
  - The limiter is created once per mount. Every press calls it. One `requestAnimationFrame` re-render ticks the countdown only while `retryIn > 0`.
  - **Droplets:**
    - An accepted droplet (fringe) falls through the route and off to the right.
    - A rejected droplet falls below the route and stays there. Rejected droplets are slate; the visitor's own fringe is only on accepted ones.
    - The vessel border escalates: slate, then hatched at 1 left, then a `--fault` status line on 429.
  - **Response preview:** the real status line `HTTP/1.1 429 Too Many Requests`, then the real headers and the body.
  - **Announcements:** `aria-live` says either "200 OK. 4 requests left." or "429 Too Many Requests. Retry after 7 seconds."
  - **Keyboard:** held Enter on the Send button auto-repeats, so it works as spam. Send ×10 is there for thumbs.
  - **Reduced motion:** no falling. Droplets appear in their final place.
  - **Code line:** `hitlimit({ limit: 5, window: '10s', response: { message: 'Slow down cowboy!' } })`
  - **Pull-out:** the facts from PRODUCT.md (8 stores, zero-dependency core, 6 frameworks, tiered limits and auto-ban, about 3.3K downloads a month), `bun add @joint-ops/hitlimit`, and a link to https://github.com/JointOps/hitlimit-monorepo.
- [ ] **Step 6: Visual and interaction check.**
  - Spam with Enter held and with 100 taps: the pile caps and the "+N" count appears.
  - Wait 10 s: the vessel refills.
  - Switch tabs for 15 s and come back: the vessel is full.
  - Check desktop and phone, both themes, and reduced motion.

### Task 4: Device benchmark (Web Worker)

**Files:**
- Create: `src/lib/bench.ts` (pure: `runFor` and `formatChecks`), `src/lib/bench.test.ts`
- Create: `src/lib/bench.worker.ts`
  - builds `hitlimit({ limit: 100, window: '1m' })` and calls `exchange(mw, ips[i & 1023])` over 1,024 rotating keys
  - posts `{ checks }`
- Modify: `HitlimitStop.tsx`
  - a "Benchmark my device" button (disabled while running) and a result line
  - spawned with `new Worker(new URL('../lib/bench.worker.ts', import.meta.url), { type: 'module' })`
  - terminated on unmount

**Interfaces:**
- Consumes: `exchange` from Task 3
- Produces:
  - `runFor(ms: number, step: () => void, now: () => number): number`. It reads the clock every 1,024 steps and returns the number of steps completed.
  - `formatChecks(n: number): string` uses `Intl.NumberFormat('en-US')` and returns `"Your device ran 4,812,330 hitlimit checks in one second."`. The template lives in `content.stops.hitlimit.bench`.

- [ ] **Step 1: Write the failing tests:**
  - With a fake clock that advances 1 ms per call, `runFor(10, step, now)` returns `10 * 1024`, and `step` is called exactly that many times.
  - `formatChecks(4812330)` contains `4,812,330`.
- [ ] **Step 2:** Run `bunx vitest run src/lib/bench.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `bench.ts`, the worker, and the button.** On Worker error or no Worker support, show `content.stops.hitlimit.benchFailed`. The Worker never runs on load.
- [ ] **Step 4:** Run the tests again. Expected: PASS. Then `bun run build` has exit code 0 and emits a separate worker chunk under `dist/assets`.
- [ ] **Step 5: Check it in a real browser.** Click the button and a number appears after about 1 s. Double-clicking runs it only once. During the run, the main thread stays responsive (the vessel still accepts presses).

### Task 5: Finish the stage

- [ ] **Step 1:** Run `bun run test && bun run typecheck && bun run build`. All three must pass, with around 45 tests.
- [ ] **Step 2: Full visual pass.**
  - Cover the hero, 01 and 02 at 1440×900 and 390×844, in light and dark, at `?tier=high` and `?tier=static`, and with reduced motion.
  - Keyboard-only: Tab through every control and check that the dashed focus ring is visible.
  - Run the impeccable detector on the changed files. The only acceptable advisory is the drafting grid, which was already sanctioned.
- [ ] **Step 3: Update the docs.**
  - **README:** add "How the journey works" and a knob table (`FOCUS_ANCHOR`, `FOCUS_Z`, `LIMIT`, `WINDOW`, the `sky` thresholds, and `shimmerFrom`'s 30 ms).
  - **`docs/design.md`:** correct stop 02 to say fixed window plus the real middleware, instead of token bucket.
  - **Ledger:** record every ruling in `.superpowers/sdd/stage2-journey/progress.md`.

## Draft copy (lives in `content.ts`; Shayan edits)

| Key | Draft |
|---|---|
| edge.headline | Seven years building what other teams build on. |
| edge.sentence | Your request crossed the wire five more times just now. Here's what the edge felt. |
| edge.code | `const { region, id } = parseVercelId(h.get('x-vercel-id'))` (real line from `api/whoami.ts`) |
| edge.bio | Backend architect, 7+ years. Karachi, working remote with teams anywhere. / Honeycomb Protocol's 4-language SDK generator; GameShift's payment APIs. / Now: open source for Node.js and Bun: hitlimit, bunWay, kaput. |
| edge.callouts | `7+ yrs · backend` · `Karachi · UTC+5` · `JointOps · OSS` |
| hitlimit.headline | Spend a request. Then spend too many. |
| hitlimit.sentence | That's the real hitlimit middleware, running in your tab: five requests every ten seconds, then 429. |
| hitlimit.code | `hitlimit({ limit: 5, window: '10s', response: { message: 'Slow down cowboy!' } })` |
| hitlimit.bench | Your device ran {n} hitlimit checks in one second. |
