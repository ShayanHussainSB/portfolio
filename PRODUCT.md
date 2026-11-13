# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

User-pinned: React + Vite (no Next.js), fully static output plus one tiny edge function, deployed on Vercel. 3D in plain three.js, lazy-loaded. Bun as package manager.

## Users

Three audiences, weighted equally:
- **Hiring CTOs / engineering leads** filling remote backend-lead or staff roles. They skim fast and need credibility within seconds.
- **Founders hiring a contract architect.** They want proof of end-to-end system thinking.
- **Developers evaluating his open source** (hitlimit, bunWay, kaput). They are code-first and want real APIs and real behaviour.

Phone traffic is expected to be as important as desktop, often from in-app browsers such as LinkedIn's.

## Product Purpose

The personal portfolio of Shayan M Hussain, a backend architect with 7+ years of experience, based in Karachi and open to remote work worldwide. It exists to turn visits into **email contact**, the single conversion goal. Success means a visitor leaves understanding what he builds, believing he builds it well, and wanting to share the site.

## Positioning

"I build the systems other developers depend on." He makes backend infrastructure, developer tooling and open source. The site demonstrates his systems working (rate limiting, graceful shutdown, state compression) instead of describing them.

## Capabilities and Constraints

- Signature interactions must behave like the real systems (the real hitlimit middleware, a real drain state machine, a real Merkle root), because engineers will check.
- The "visitor's own request" uses real edge data from a Vercel Edge function (city, country, region; RTT measured client-side), with a timezone fallback.
- Secrets are wanted: hidden dropped packets, a hidden terminal, a DevTools console puzzle, and a `curl`-able CV.
- Performance: fast first paint with a static fallback, lazy 3D, adaptive quality, 60 fps on a mid-range laptop.
- Desktop and mobile get equal design attention; mobile is not a shrunk desktop.
- Sound is opt-in and muted by default.
- All visible text is drafted by Claude in Shayan's voice and edited by him; content lives in one typed file.

## Brand Commitments

- No existing brand assets; the identity is invented for this site.
- Voice: dry wit and senior, with playful hidden secrets and puzzles.
- Binding anti-references from Shayan: Matrix code rain, fake typing intros, CRT scanlines, generic spinning globes, purple-gradient SaaS look.
- Liked references: Linear/Vercel, Stripe Sessions/docs, Teenage Engineering, Bruno Simon / igloo.inc.
- Direction: a black ground with one hue per project, played as a cinematic scroll: a 3D flight down the request path, pinned project scenes, and a Solana journey that turns from NFT art into a blockchain tunnel. Earlier directions (Cloud Edge, SIGNAL) were rejected.

## Evidence on Hand

All verified from GitHub READMEs and npm on 2026-11-12:
- **hitlimit** (`@joint-ops/hitlimit`, `@joint-ops/hitlimit-bun`, v1.5.0)
  - 8 stores, zero dependencies in the core, 6 frameworks
  - tiered limits and auto-ban
  - about 3.3K downloads a month
  - Published speed claims conflict between the README and npm, so the site uses a live in-browser benchmark instead of quoting a figure.
- **bunWay** (v1.1.0)
  - Express-compatible framework on Bun
  - 26 built-in middleware, 0 dependencies, 2,423 tests, "97%+ Express parity"
- **kaput** (`@joint-ops/kaput`, v0.1.0)
  - zero-config graceful shutdown
  - auto-detects Express, Fastify, Prisma, Redis, BullMQ, Mongoose and Knex
  - `/health` and `/healthz` endpoints
- **TUP** (in progress, shown redacted): "the trust layer for Pump.fun", with insurance tiers, rug detection and reputation.
- **Honeycomb Protocol** (names cleared for use): Web3 game infrastructure on Solana (docs.honeycombprotocol.com)
  - modules: Hive Control (projects, users, profiles, delegates), Character Manager, Resource Manager, Nectar Missions, Nectar Staking, behind the Edge Client API
  - SDKs: JavaScript, C# (Unity), C++ (Unreal Engine), Godot; Shayan built the GraphQL-to-SDK generator (4 languages)
  - compression: 1000x or more cheaper on-chain state with verification kept; docs benchmark: create profile 0.0052100 → 0.0000041 (99.92%), mission start 0.0024250 → 0.0000100
- **GameShift** (name cleared): NestJS aggregation, indexers, WebSockets, in-game payment APIs.
- **Hackathons:** Sandstorm 2023 winner, Grizzlython 3rd place, Civic Hackathon winner.
- **Solana work** (Shayan's own words): smart contracts in Anchor/Rust with GraphQL, Node and React around them for Sol Patrol, The Fracture, BONK and Mad Lads; later Rust, gRPC and digital asset tooling. NFT artwork shown on the site belongs to its creators; Fox collections are ecosystem illustrations, not work credits.
- **Assets:** photos supplied. CV PDF and testimonials are still to come from Shayan, and none may be invented.
- **Contact email:** shayanhussain48@gmail.com (confirmed 2026-11-12).

## Product Principles

1. Show the system working; never just describe it.
2. Every number on the page is true or measured live; no vanity stats.
3. Depth is one interaction away: the hook comes first, and the proof is close behind.
4. Reward curiosity: secrets are a feature, not decoration.
5. It never breaks: static text first, then 3D as enhancement on any device.

## Accessibility & Inclusion

- Respect prefers-reduced-motion with a polished static version.
- The whole site is keyboard navigable, with readable contrast.
- All content is real DOM text, never only inside the canvas.
- Interactions announce their state through live regions.
