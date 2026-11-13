# Immersive Solana journey

## Intent

A first-person story of Shayan's Solana work, placed between EdgeStop and featured projects. The experience uses the existing banner's scroll-driven Three.js camera and the portfolio's principle of explaining mechanisms through working examples. The user explicitly requested implementation without mockups.

## Visual structure

The opening presents a gallery of public NFT portraits. The surface artwork fades before the ownership chapter. From ownership onward, the full-screen flight follows a curved sequence of softly lit blocks with one connecting path. Each block has records, a hash and a previous hash; these example hashes are computed by the existing chain helper. It is an illustrative ledger, not live Solana data.

The camera follows the chain without rolling. The ledger remains in the full-screen environment behind the narration. The side-view strip was removed at the user's request. The rest of the page is deliberately quiet. The earlier dense wall tiles, racks, floating grids, wire frames, dust and branching scenery have been removed. Shared geometry/material resources are disposed once.

## Chapters and interactions

1. NFT communities: local gallery artwork opens in a native modal with collection context, original source links, previous/next buttons, arrow-key navigation and Escape dismissal. Existing global dialog scroll locking applies.
2. Ownership and games: choose a character and destination, launch an expedition, see travel lock the character, collect resources and replay. This is a playable model, not a transaction or a wallet connection.
3. Compression: fold 64 records into one root, verify an inclusion proof or alter the record to demonstrate failure. The real existing Keccak Merkle implementation runs in the browser.
4. Indexing: level up a synthetic on-chain character; its updated state travels to the application view after a short delay. Disconnecting holds the application view and reconnecting catches it up.
5. Developer tooling: illustrate typed SDK surfaces from a GraphQL schema. Snippets are clearly identified as examples rather than real API signatures.
6. What's next: an animated full-screen heading and request-flow motif lead into the existing hitlimit section at #work.

Narration lives in journeyStory in src/content.ts and is grounded in PRODUCT.md and the user's own descriptions, including Rust and gRPC.

## Themes

Auto follows chapter palettes: Light, Dark, Darker, Darker, Dark, Light. DOM color tokens transition over 0.8 seconds; renderer background/fog interpolation is time-based. There are no manual theme controls or persisted overrides: every visitor follows the intended chapter palettes.

## Assets, accessibility and performance

Nineteen local portraits cover Sol Patrol, Mad Lads, Famous Fox Federation and Transdimensional Fox Federation. Source metadata is in src/assets/photos/journey-sources.json. Sol Patrol and Mad Lads relate to documented work; Fox artwork is explicitly identified as an ecosystem illustration rather than a work credit. Images decode before their 3D planes appear.

WebGL loads as the section approaches the viewport, renders only while visible, caps pixel ratio at 1.5 and handles context failure. Reduced motion renders the full story in normal flow without WebGL. In motion mode inactive chapters are hidden and inert. Mobile chapter content scrolls when it exceeds available height and hands scrolling back to the page at its edges.

Validation covers typecheck, the existing test suite, SSR/prerender build, desktop/mobile screenshots, image loading, chapter themes, proof verification and tampering, stream catch-up, mission rewards, gallery controls, reduced motion and the hitlimit handoff.

## Animated block lifecycle

The slides and existing examples stay intact. Hovering a block opens its records; clicking the exposed canvas or pressing Enter while the canvas is focused starts an illustrative transaction sequence. Records arrive, a validation sweep passes, the body closes/seals, and a packet travels to the next block’s previous-hash reference. The sequence also plays on entry into each deeper chapter. Labels and hashes are rendered on the blocks; no new slide panels or visible controls are added. Canvas interaction has a keyboard equivalent and announces stages to assistive technology.

## SDK schema playground

The developer-tooling example is an interactive schema model. Required id/owner fields remain present; optional level, resources and mission fields update generated TypeScript, C#, C++ and Godot declarations and usage examples. A local sample read shows matching profile data in the same output pane. The type/usage/data views share a compact footprint. Outputs are labelled illustrative SDK APIs; no remote requests or execution of non-JavaScript code is implied. Pure generation invariants are covered by unit tests, and browser checks exercise the field toggles, all four languages and returned data.
