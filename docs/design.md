# Cloud Edge — Portfolio Design

Portfolio for **Shayan M Hussain**, backend architect (7+ yrs, Karachi, remote worldwide).
Positioning line: **"I build the systems other developers depend on."**
Product truth lives in `/PRODUCT.md`. The direction contract lives in `.impeccable/surfaces/index-html.md`.

## 1. Intent

The visitor's page load *is* a request. It arrives at **the edge of the cloud**, and
the site observes it live, then traces it through Shayan's real systems. The systems
are drawn as a white-print engineering drawing that comes alive in 3D. Every stop on
the lifecycle is one of his projects, shown by *doing the thing*.

**Memory test.** After one screen, the visitor should tell a friend: *"it knew my request."*

**Conversion goal.** One: email contact.

**Must not feel like:**
- too much reading;
- a game instead of a senior engineer's site;
- the generic neon-on-black dev site;
- 3D spectacle hiding the substance.

## 2. World: Cloud Edge, drafting on vellum

Atmospheric-optics plates fused with white-print engineering drawings. The full
contract is in the surface brief.

| Token | Value | Role |
|---|---|---|
| `--cloud` | `#F7F8F9` | ground (vellum) |
| `--mist` | `#EDEFF2` | quiet surfaces, cards |
| `--slate` | `#3E4652` | ink: text, hairline drawing |
| `--slate-2` | `#4F5864` | secondary text (AA on cloud) |
| `--hair` | `#C5CBD3` | dashed and hidden lines, rules |
| `--mint` / `--rose` / `--violet` | `#8FDCC0` / `#E7A1BE` / `#8E78DB` | **the fringe**: only where the visitor's request is live |
| `--violet-ink` | `#5E48B8` | violet text and "you are here" (AA) |
| `--fault` | `#D9452B` | faults, the kill switch, 429s (escalation only) |

**Colour rules.**
- Colour means state. The drawing itself stays achromatic.
- The fringe exists only along the visitor's path.
- Faults escalate in three steps: calm slate → hatched border → a full-colour cut.

**Type.**
- **Hanken Grotesk** for display and body (200 for display, 300–500 for text).
- **B612 Mono** for data, measurements and code only. It was designed by Airbus for cockpit legibility.
- Both are self-hosted. Display size tops out at 6rem.
- No eyebrow kickers and no gradient text.

**Drawing furniture.**
- 24px drafting grid
- slate hairlines
- dimension lines carrying real measurements (RTT, bytes)
- a title block
- the **Observation card** (time · LIVE · city → edge · RTT)

**State notation.** Solid lines mark your path, dashed lines mark paths not taken, and hatching marks sealed or compressed parts. State never depends on hue alone.

**3D.**
- Frosted, vellum-like volumes with slate edge lines.
- The request path is a ribbon with a **thin-film interference shader**, so its colour shifts with viewing angle, like the real optics.
- No bloom and no glow.

**Night edge.** `prefers-color-scheme: dark` swaps to a deep slate sky with the same fringe, like an aurora. It is the same world after dark, not a separate theme.

**Sound.** Opt-in and muted by default: soft wind, glassy ticks, a low hum, and a spin-down for the kill switch.

## 3. The journey

| # | Stop | Project | Signature interaction |
|---|---|---|---|
| 00 | **Observation (hero)** | — | Your request observed live at the edge: city → edge region, RTT, local time. The 3D drawing of the system, with your fringe ending in a violet node. Includes "Write to me". |
| 01 | **Edge** | About | **Conditions at the edge.** Five real pings to the edge function measure RTT and jitter, and that measured variance drives the fringe's width and shimmer. Bio in three lines. |
| 02 | **Rate limiter** | hitlimit | **A glass vessel running the real middleware.** The published `@joint-ops/hitlimit` runs in the tab. It is a fixed-window counter (5 per 10 s): each "Send request" spends one droplet, and the window refills all at once. Spamming returns a real `429` with `Retry-After`, plus "Slow down cowboy!" set through hitlimit's `response` option. Rejected droplets **fall below the route and stay there**. **Live benchmark:** a Web Worker runs the same middleware for 1 s and reports "your device ran N checks in one second". |
| 03 | **Framework** | bunWay | **Middleware as thin films.** The visitor's GET passes through the published `bunway@1.1.0` middleware, running unmodified in the tab: `cors`, `helmet`, `requestId` and `responseTime` (the four that set headers and need no Bun or Node APIs; logger and session would have to be faked). Peel a film off and its real headers leave the live response. The code line is the README's own diff: `require("express")` → `import { bunway } from "bunway"`. Facts: 26 middleware, 0 deps, 2,423 tests. |
| 04 | **State** | Honeycomb (+ GameShift) | **A real Merkle root, computed in your browser.** 4,096 example records condense into one root using Keccak-256, as Solana's concurrent Merkle trees do (leaf = keccak(record), node = keccak(left ‖ right)). Pick any record (click the field, or use the slider) and its proof climbs a 12-rung ladder: "verified with 12 proof hashes, not 4,096". Tamper with it and the fault grammar plays. Secondary beat: `schema.graphql` fans out to the SDK languages listed in `content.ts` (TypeScript, Rust, Python; the 4th is still to be supplied). GameShift appears as a side note. The ×1000 before/after figures are a labelled placeholder until supplied. |
| 05 | **Shutdown** | kaput | **A kill switch under a flip-up cover.** Visitor-generated traffic is in flight when the switch flips, and a real state machine runs: `SIGTERM → stop accepting → drain N → 0 → close Prisma → close Redis → close BullMQ → exit 0`. Shows **dropped: 0**. The fault escalation grammar plays here. |
| 06 | **Classified** | TUP | A redacted sheet with frosted bars. It declassifies after all 5 dropped packets are found. |
| 07 | **Record** | Career | A revision history (REV A → REV G): Honeycomb, GameShift, Senior SWE years, hackathon wins, stack, testimonials, CV. |
| 08 | **Response** | Contact | `HTTP/1.1 200 OK` with your real request ID. **"Write to me"** opens an email pre-filled with *"Re: request 7F3A from Karachi"*. |

**Copy budget per stop:** one headline, one sentence and one highlighted line of real code. Everything else lives in a pull-out detail sheet.

## 4. The fun layer

Each delight is a real system reacting to the visitor's real request, never generic whimsy. The thesis: *you feel seen by the system.*

**Live and personal**
1. **The observation.** The edge function returns city, country and edge region. A request ID (`7F3A`) comes from `x-vercel-id`, and RTT is measured. The visitor's local time sets the sky: dawn tints toward mint, dusk toward rose, and night switches to night edge.
2. **Welcome back.** A returning visitor sees *"Request 7F3A was last observed 3 days ago from Karachi. Resuming at Sheet 04."* Where they stopped is flagged and restored. This uses localStorage and degrades silently.
3. **The tab title is a request.** It reads *"1 request in flight"* while you're away and *"200 OK"* when you return.
4. **The reply is pre-addressed.** The contact email's subject carries your request ID and city.

**Systems you can poke**
5. **Spam the bucket:** a real 429 with hitlimit's own message, *"Slow down cowboy!"*.
6. **Benchmark your own device** in a Worker.
7. **Turn middleware off** and watch the response headers break.
8. **Click any Merkle leaf** to verify it against the root using real hashes.
9. **Flip the cover and kill the server**, then watch nothing drop.

**Secrets**

10. **Five dropped packets** sit in places that look like noise:
    - a droplet that missed the vessel
    - a film between middleware layers
    - a stray Merkle leaf
    - one line in the kaput log
    - the footer's title block

    They are keyboard-focusable. Collecting all five declassifies TUP and earns a "packet inspector" stamp in the title block.

11. **Hidden terminal.** Press `` ` ``, or long-press the title block on a phone. Commands:
    - `help`, `whoami` (real edge data), `traceroute` (draws your hops), `weather` (edge conditions)
    - `ls`, `cat about.txt`, `ping`, `top`, `kill -9 <pid>`, `sudo hire shayan`, `clear`, `exit`
    - **`spike`**: *INC-0001*. The sky darkens into a storm and a ×40 surge hits the topology. hitlimit holds and kaput rolls a deploy. The run ends on a postmortem card: *root cause: Shayan*.

12. **DevTools console puzzle.** A styled greeting with a riddle. Half the answer is in an `X-Clue` response header and half is in the console. Entering it in the terminal unlocks a hidden sheet.

13. **`curl <domain>`** returns a terminal-styled CV with ANSI colour, via a `vercel.json` rewrite on `User-Agent: curl*`.

14. **Print it.** Printing the page (or saving it as a PDF) produces a real one-page drawing-sheet CV. Recruiters will use this.

15. **Error pages.** The 404 page reads *"404: request dissipated"*: a cloud that thins as you look at it, with a way home. Offline, the site shows *"Edge unreachable, serving from cache"*.

**Browser surfaces carry the world**

16. Text selection is tinted with the fringe, the caret is violet, and the focus rings are dashed hairlines like drafting.
17. The scrollbar is a hairline, and tabular numerals are used in all data.

**Restraint rules.**
- Nothing blocks reading or contact.
- Secrets never hide required content.
- Sound needs consent.
- Every flourish has a reduced-motion version and a keyboard path.

## 5. Technical approach

**Stack**
- Vite + React + TypeScript, built with Bun.
- `three`, `@react-three/fiber`, `@react-three/drei`, and `gsap` + ScrollTrigger for the camera timeline.
- No physics engine and no post-processing library. Effects are custom lightweight simulations and shaders: the thin-film ribbon, droplets on instanced meshes.

**Loading**
- **First paint:** `react-dom/server` prerenders the full DOM into `index.html` at build time, and the client hydrates it. The static SVG drawing is both the first paint and the no-JS view.
- **Lazy 3D:** the canvas chunk loads after hydration when the browser is idle. It is skipped when WebGL is unavailable.

**Adaptive quality**
- Three tiers: `high`, `mid` and `low`.
- drei `PerformanceMonitor` steps down a tier when frames drop.
- Low-tier phones get the animated SVG drawing instead of WebGL.

**Mobile and motion**
- **Mobile:** the drawing becomes a vertical sequence diagram (time flows down), with the Observation card pinned and controls in the thumb zone. Haptics fire on the kill switch.
- **Reduced motion:** there is no camera flight, and static drawings are shown instead. Interactions still work, with instant state changes and logs.

**Accessibility**
- Real DOM text with a heading hierarchy.
- Buttons announce their state through `aria-live`.
- The terminal is an accessible dialog.
- Skip link, visible focus and AA contrast in both themes.

**Edge and deploy**
- **Edge function:** `api/whoami.ts` (Vercel Edge) serves both JSON and the curl CV. The site falls back to an `Intl` timezone guess if it fails.
- **Content:** every word and link lives in `src/content.ts`.
- **Deploy:** Vercel.

## 6. Build stages

1. **Hero vertical slice:**
   - scaffold, tokens and fonts
   - prerender and hydration
   - static SVG drawing fallback and reduced-motion view
   - `whoami` edge function and the Observation card
   - 3D hero drawing with the thin-film request ribbon
   - quality tiers, night edge, mobile hero, themed browser surfaces

   *(Review checkpoint.)*
2. Scroll journey, Edge conditions, hitlimit (vessel, 429, Worker benchmark).
3. bunWay thin films, then the Honeycomb Merkle root and SDK fan-out.
4. kaput kill switch, Record, and Response/contact.
5. Secrets: packets, terminal and `spike`, console puzzle, curl CV, TUP, print sheet, 404, sound, tab title.
6. Performance and accessibility pass, finish review, DESIGN.md, and a README covering setup, deploy, how each interaction works, and the asset list.

## 7. Open: needs Shayan
- ~~**Contact email**~~: confirmed 2026-11-12 as `shayanhussain48@gmail.com`.
- **Honeycomb 1000x:** real before/after figures. Placeholders are labelled until then.
- **Assets:** photo, CV PDF, and 2–4 testimonials. None are invented.
- **Domain:** can come later.
