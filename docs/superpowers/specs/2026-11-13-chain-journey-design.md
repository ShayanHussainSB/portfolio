# Chain journey — design

A new section telling Shayan's Solana story as a blockchain the visitor flies through.

## Intent

Before the open-source infra (hitlimit, bunWay, kaput), Shayan spent four years shipping on Solana for collections people recognise. The page currently mentions Honeycomb in one bio line. This section makes that history felt: a short cinematic journey, NFT art as the hero imagery, one line of words per block. Depth stays in the resumes (`public/resumes/rust-solana.pdf`, `solana-multi-sig.pdf`).

Audience: hiring teams skimming a portfolio, including Solana teams. Success: they leave knowing "this person built smart contracts and the full stack for Sol Patrol, The Fracture, Mad Lads and BONK, and made on-chain state 1000× cheaper".

## Goals / non-goals / anti-goals

- **Goal:** GTA VI-style scroll. The section pins, and scrolling carries you forward through blocks stacked in depth. Each block fills the screen in turn with its art, headline and hash.
- **Goal:** it reads as a real chain. Each block shows height, year, `hash` and `prev`, and the hashes are real.
- **Non-goal:** per-project deep dives, metrics per collection, or a second compression demo (the Honeycomb sheet in "See all" already has the live Merkle tree; the compression block links to `#all-state`).
- **Anti-goal:** any claim Shayan didn't make. No invented numbers, no per-collection roles beyond what he stated: smart contract engineer (Anchor/Rust) plus full-stack (GraphQL, Node, React) on all of them.
- **Anti-goal:** jank or a heavy load. No new dependencies and no WebGL.

## Placement

`App.tsx`: directly after `<EdgeStop/>` (headline "The invisible work. The visible difference.") and before `<div className="work">`. Anchor `#chain`. The header nav is unchanged; the terminal gets one `chain` command if `lib/shell.ts` has a pattern for jump commands (builder's call).

## The chain (content, in `content.ts` under `chain`)

| # | Year | Headline | Art | Line |
|---|------|----------|-----|------|
| 0 | 2020 | Genesis. | none (typographic block) | Freelance backends: a trading engine across 5+ exchanges, game servers under 50 ms. |
| 1 | 2022 | Sol Patrol. NFTs, raffles, staking. | Sol Patrol token | Where Honeycomb began. Smart contracts in Anchor/Rust, full stack in GraphQL, Node, React. |
| 2 | 2022 | The Fracture. | The Fracture token | same role line |
| 3 | 2022 | BONK. | BONK token logo | same role line |
| 4 | 2023 | Mad Lads. | Mad Lads token | same role line |

Years are public launch years (Shayan's call): BONK Dec 2022, Mad Lads Apr 2023. The Fracture's date isn't public; 2022 is inferred from it trading on Yawww/Hadeswap. It's marked `TODO(Shayan)` in `content.ts`.
| 5 | 2022–26 | Games, on-chain. | none, or a Honeycomb mark | Honeycomb: profiles, characters, missions, staking behind one API. |
| 6 | 2023 | 1000× cheaper state. | none (the Merkle motif) | Compressed accounts on the SVM. Links to `#all-state`. |
| 7 | 2023 | Sandstorm. Grizzlython. Civic. | none | Three hackathon wins. |
| 8 | now | Head. | none | 10+ programs on mainnet, zero security incidents. CTA: "Ask me about it", linking to the existing contact `ctaHref` plus LinkedIn. No resume link (resumes stay gitignored). |

Era order follows Shayan's words: NFTs → raffles → staking → games → compression. "aps" is left out until he names it; naming a collection he didn't work on would be a false claim.

## How it's built (approach chosen: depth fly-through, CSS 3D)

Considered:
1. **Depth fly-through in CSS 3D (chosen by Shayan).** Pinned stage with `perspective`; blocks sit at increasing `translateZ` depth, and scroll progress `--p` moves the "camera" (one container's `translateZ`) toward the viewer. Reuses `useProgressVar` and is light on phones.
2. three.js chain in space. Most spectacular, but the heaviest; it needs a fallback and takes longer to build.
3. Horizontal pan. Simplest, but it reads as a timeline rather than a film.

Mechanics:
- `ChainJourney.tsx`: `.chain__pin` is roughly `(n + 1) × 100svh` tall, and `.chain__stage` is sticky at 100svh, the same shape as `.scene__pin`/`.scene__stage`. `useProgressVar` sets `--p` on the pin.
- Each block gets `--i` (its index). CSS computes its local phase from `--p × n − --i`, so it approaches from the far distance, fills the screen, then passes behind the camera with a fade. All of this is pure CSS calc, with no per-frame React renders.
- **Mining:** when a block reaches the front (phase near 0), its hash goes from scrambled to settled. This one bit needs JS: an IntersectionObserver or a phase check in the same rAF reads which block is current and sets `data-current`; a small effect scrambles the text for about 400 ms and then shows the real hash. Respect reduced motion: no scramble.
- **Link:** a short connector line between the current block and the next draws in (`scale` from `--p`), labelled with the `prev` hash fragment.
- **Hashes are real:** `hash_i = keccak256(hash_{i-1} ‖ utf8(year + headline))`, with `hash_{-1}` = 32 zero bytes, using `@noble/hashes` (already used by `lib/merkle.ts`). Computed once at module load in `lib/chain.ts`. Shown as `0x9f3a…e1c0`. One `chain.test.ts`: block 1's `prev` equals block 0's `hash`, and changing a headline changes every later hash.
- **Colour:** a new token pair `--hue-chain`/`--deep-chain` at the same OKLCH lightness as the other project hues, picked to differ from them (Solana-ish violet-green is taken by hitlimit/kaput, so the builder picks; suggestion: a warm gold distinct from quarry, or a gradient border only on the head block). Volt/coral rules unchanged.
- **Art:** each collection block shows its image large (about 60vh square), with a slight parallax inside the block. Typographic blocks use oversized type instead.

## Images

- Pull one public image per collection: Sol Patrol, The Fracture and Mad Lads (a single well-known token's image from public metadata, e.g. the collection's own featured/first token via a public marketplace or RPC metadata URI), and BONK's token logo.
- Save the originals to `photos-original/chain/` (gitignored, as with the existing photos) and make `src/assets/photos/chain-<id>-<600|1000>.avif|webp|jpg` with the README's `sips` steps, so `srcSet`/`fallbackSrc` work unchanged.
- Alt text names the collection ("A Mad Lads NFT, …"). Shayan reviews each image and can swap any.

## Fallbacks and accessibility

- `prefers-reduced-motion: reduce` means no pin: blocks render as a vertical list, flat, with hashes already settled (the same pattern as the `.scene` reduce rules).
- The DOM order is the chain order, so screen readers get an ordered list (`<ol>`) of blocks, each with a heading. Hash text is `aria-hidden`, with a visually hidden "Block 3 of 9, 2023" instead.
- SSR prerender: content is static and hashes are computed at import, so the prerendered HTML includes everything.
- Mobile: the same depth effect with a shallower perspective; images about 70vw. No horizontal scroll.

## Left to the builder

The exact pin length and easing curves, the chain hue, connector styling, and whether the terminal gets a `chain` command.

## Open for Shayan (non-blocking)

- Confirm The Fracture's year.
- Swap any token image he doesn't like.
- Name "aps" if he wants it on the chain.
