# Shayan M Hussain — Portfolio

**Live:** https://shayan.jointops.dev

A black ground, one hue per project, and a page that scroll plays like a film: a 3D flight down the
request path, three featured projects that open through their own names, and every project running
for real in the visitor's tab. Product truth (audience, facts, principles) is in `PRODUCT.md`.

## Run

```bash
bun install
bun run dev        # http://localhost:5173  (/api/whoami is mocked as "Localhost → dev1")
bun run test       # vitest
bun run typecheck
bun run format     # prettier (TS only; site.css keeps one rule per line by hand)
bun run check      # typecheck + tests + format check
bun run build      # client build + SSR prerender → dist/index.html has the full text
```

## Deploy (Vercel)

Connected to Vercel: every push to `main` deploys to production, and pull requests get preview URLs. `vercel.json` sets the build and output. `api/whoami.ts`
deploys as an Edge Function and reads Vercel's city, country and request-id headers.

## SEO and analytics

The canonical address is `https://shayan.jointops.dev`. It is written into these files, so a domain change means updating all of them:

| File | What it does |
|---|---|
| `index.html` | title, description, canonical, Open Graph/Twitter cards, and JSON-LD (`ProfilePage` → `Person` with `sameAs` GitHub/LinkedIn). Every fact in it comes from `PRODUCT.md` |
| `public/robots.txt`, `public/sitemap.xml` | let every crawler in, including AI ones |
| `public/llms.txt` | a plain-Markdown summary for AI assistants ([llmstxt.org](https://llmstxt.org)). Keep it in step with `PRODUCT.md` |
| `public/og.jpg` | the 1200×630 social card |
| `public/shayan-m-hussain.jpg` | the portrait the structured data points to (metadata stripped) |

`@vercel/analytics` and `@vercel/speed-insights` are injected in `main.tsx`. Both are free on Hobby and need switching on once in the project's Analytics and Speed Insights tabs.

## The visual system (`src/styles/site.css`)

| Token | Role |
|---|---|
| `--ground` `#07070a` | page ground (black) |
| `--paper` `#f4f4f1` | text on the ground; the ground of About, Record and every demo sheet |
| `--ink` `#0c0c12` | text on paper |
| `--hue-<project>` / `--deep-<project>` | one hue per project at equal OKLCH lightness (0.72), plus a deep shade for its code block. Each `#project` maps them to `--hue` / `--deep`: name, live strip, code block, sheet shadow. In the hero, traffic takes each project's hue after its gate |
| `--volt` `#dfff4f` | the visitor only: their streak, their tokens, the reply button |
| `--fault` `#ff6a4d` | faults only: 429s, a tampered proof, a closed gate (scroller's red hue never shares a section with a fault) |

- Type: Archivo (variable, set at 125% width for display) and Martian Mono for code and HTTP only.
- Photos are printed in the ink with blend modes (`.duo`, `.response__photo`): no colour photo ships.
- One scroll gesture: project names open from condensed to full width as they enter (`@keyframes open`). Browsers without scroll timelines show them open.
- Reduced motion: the stream renders one still frame; nothing else moves.

## The page, top to bottom

1. **Flight** (`components/Flight.tsx`, three.js, lazy-loaded): the hero is a tall section with a pinned stage; scroll flies the camera down the request path, through hitlimit, bunWay, Honeycomb and kaput. Reduced motion or no WebGL gets the 2D stream (`Stream.tsx`) instead; no JavaScript gets the headline.
2. **About** (`components/EdgeStop.tsx`): who he is, beside a live readout of the visitor's connection.
3. **Solana journey** (`components/ChainJourney.tsx`): six pinned chapters. It opens on a gallery of NFT portraits (`JourneyGallery.tsx`); scrolling deeper, `JourneyFlight.tsx` (three.js, lazy) turns them into a winding tunnel with linked blocks on the wall and block rings that fill, seal and show their hash and the previous block's. Each chapter carries a working example (`JourneyExamples.tsx`): a mission game, Merkle compression with a real proof, an indexing pipeline (`lib/asset-pipeline.ts`) and a GraphQL-to-SDK playground (`lib/sdk-example.ts`). Narration is `journeyStory` in `content.ts`; chapter palettes switch light/dark as you go. Reduced motion gets the chapters in normal flow, without WebGL.
4. **Three featured projects** (`content.featured`), each opened by a pinned **scene** (`components/Scene.tsx`): the name is a window onto the project's film (its strip scene at poster size), scroll zooms through it, and the `vision` from `content.projects` is set over it. The working demo follows in normal flow.
5. **Index** (`Index` in `components/AllWork.tsx`): all seven projects as a directory listing, and **See all work**.
6. **See all** (`AllWork`): a full-screen `<dialog>` with every project running. `#all` opens it; `#all-<project>` opens it at that project, so those links can be shared.
7. **Ask the site** (`components/RecordStop.tsx`): a conversation. The visitor picks questions and the site answers for Shayan (`content.stops.record.ask`); one answer is a Brainfuck program that runs on the spot. Then six figures that count up (`stats`). Every claim and number comes from `PRODUCT.md`; keep it that way.
8. **The reply**: the contact section. Each link (GitHub, LinkedIn, JointOps, email) has a soft, clay-style 3D character on its own stage (`components/Mascots.tsx`: one canvas, one viewport per link, in the order of `content.response.links`). The characters are original; the official GitHub and LinkedIn marks (`lib/icons.ts`) appear only on the badges they hold. Without WebGL the links show flat icons.

The flight is the inside of an optical fibre: twisting strands of glass, ribs, and transistors on the wall whose gates switch in the colour of the project that owns that stretch (`Flight.tsx`, "the place"). It narrates itself: `content.stream.tour` holds one caption per stage, beside live counts of requests in flight, admitted and turned away.

## Secrets

- **Terminal**: press `` ` `` or the `>_` button. `lib/shell.ts` is a pure function from a line to output (tested in `shell.test.ts`); `components/Terminal.tsx` is only the screen. `ssh guest@shayan` logs in to the portfolio as a home directory. Nothing leaves the page.
- **Brainfuck**: `lib/bf.ts` is a real interpreter. `secret.bf` on the "remote" and `window.cheeky` in the console are the same program; `cheeky()` runs it, and printing `cheeky` shows the Brainfuck. To change what it says, regenerate the program and update `bf.test.ts`.
- The terminal greets with what to try, shows suggestion buttons under the prompt (`hints` in `lib/shell.ts`), and `help`, `--help`, `-h` or `?` list every command, including the ones that are only there for fun.
- `HIRE` in `lib/bf.ts` is the program the site runs when asked to "say that in Brainfuck".
- Clues: the console greeting (`main.tsx`), an HTML comment in `index.html`, and the `X-Clue` response header in `vercel.json`.

| Knob | Where it lives |
|---|---|
| Which projects are on the main page | `featured` in `content.ts` (and the `FEATURED` map in `App.tsx`) |
| Length of the flight, lanes, gate sizes | `L`, `COLS`, `ROWS`, `HALF_W`, `HALF_H` in `Flight.tsx` |
| How long the flight and each scene pin | `.hero[data-mode='flight']` and `.scene__pin` heights in `site.css` |
| Scene timing (zoom, dissolve, vision) | the `calc(... var(--p) ...)` lines under "featured scenes" in `site.css` |
| Solana tunnel: radius, block rings, records per ring, chapter hues | `R`, `RINGS`, `RECORDS`, `HUES` in `JourneyFlight.tsx` |
| Solana chapter palettes | `chapterThemes` in `ChainJourney.tsx`, `--j-*` tokens in `site.css` |

## How it works

- **Hero stream** (`components/Stream.tsx`, `lib/stream.ts`): a 2D canvas. Requests run through four gates placed by `GATES`; lanes fold into one line at Honeycomb (`laneY`). The hitlimit gate is a fixed window (`fixedWindow`, `LIMIT` per second), so sweeping the pointer floods it and the overflow falls away in coral. The volt streak is the visitor, tagged with their city. It pauses off screen and in hidden tabs. The gate labels above it are the links to each project.
- **The observation** (`lib/observe.ts`): times a request to `/api/whoami`; on failure it says it is guessing from the timezone. The reply button's subject carries the request ID and city.
- **About** (`EdgeStop.tsx`, `lib/conditions.ts`): five sequential `no-store` pings, median RTT and RFC 3550-style jitter.
- **hitlimit** (`HitlimitStop.tsx`, `lib/limiter.ts`): the published `@joint-ops/hitlimit@1.5.0` with a minimal fake `req`/`res`; benchmark in a Worker on request.
- **bunWay** (`BunwayStop.tsx`, `lib/films.ts`): four published `bunway@1.1.0` middleware files; `vite.config.ts` aliases `bunway/middleware/<name>`.
- **Project strips** (`Strip.tsx`, `lib/strips.ts`): a live canvas band under every project name, one scene per project, each a pure function of time (one still frame under reduced motion). Panel entrances are CSS scroll timelines in `site.css` ("every project").
- **Honeycomb** (`StateStop.tsx`, `lib/merkle.ts`): Web3 game infrastructure on Solana; its compression drawn as 4,096 example profiles in one Keccak-256 tree, 12-sibling proofs. Facts from docs.honeycombprotocol.com.
- **kaput** (`KaputStop.tsx`, `lib/drain.ts`): the published `Kaput` class with stand-in resources; close order is kaput's own.

| Knob | Where it lives |
|---|---|
| Gate positions, lane fold | `GATES`, `laneY` in `lib/stream.ts` |
| Ambient traffic and the hero limit | `acc += dt * 13`, `LIMIT` in `Stream.tsx` |
| Rate limit shown in hitlimit | `LIMIT`, `WINDOW`, `MESSAGE` in `lib/limiter.ts` (keep `content.stops.hitlimit.code` in sync) |
| Which bunWay layers are shown | `LAYERS` in `lib/films.ts` |
| Tree size | `DEPTH` in `lib/merkle.ts` |

## Content

Every word on the page lives in `src/content.ts`.

## Photos

Your originals live in `photos-original/`. That folder is gitignored and never deployed, because iPhone
photos embed GPS coordinates. The site ships only stripped, resized copies in
`src/assets/photos/` (`<name>-<width>.avif|webp|jpg`). To add or re-crop one:

```bash
# crop x y w h from the original, then one size per width (cwebp drops all metadata)
cwebp -quiet -metadata none -q 80 -crop 0 126 3024 3780 -resize 800 0 photos-original/IMG_0530.jpeg -o src/assets/photos/portrait-800.webp
sips -s format avif -s formatOptions 60 src/assets/photos/portrait-800.webp --out src/assets/photos/portrait-800.avif
sips -s format jpeg -s formatOptions 78 src/assets/photos/portrait-800.webp --out src/assets/photos/portrait-800.jpg
```

| Name | Source | Used in |
|---|---|---|
| `horizon`, `horizon-wide` | IMG_5507 | Contact, printed in blue |
| `portrait` | IMG_0530 | About, printed in blue |
| `offcall` | IMG_5346 | kaput, after exit 0 |
| `chain-solpatrol` | Sol Patrol #3323 (HowRare rank 1), arweave.net/6m345RawbnSFXagmMvSlG4I0hPwQJUoWhABHCK4ZBEg | Solana journey, mission example |
| `journey-*` | public NFT artwork; each file's collection, name and original URL are in `journey-sources.json` | Solana journey gallery and tunnel mouth |

NFT artwork belongs to its creators. Sol Patrol and Mad Lads relate to documented work; the Fox collections illustrate the wider ecosystem and are labelled that way on the page.
