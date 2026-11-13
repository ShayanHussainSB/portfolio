# SIGNAL implementation plan

Goal: rebuild the existing portfolio as one cinematic, animated landing page.
Architecture: preserve demo components and libraries; replace page composition, hero scene, tokens and presentation. New presentation stylesheet supersedes the old drafting layout. React/Vite/R3F; no added runtime dependencies.
Spec: docs/superpowers/specs/2026-11-12-signal-design.md

- [ ] Replace hero, page navigation and page motion lifecycle; preserve anchor IDs and contact observation.
- [ ] Replace box topology hero with responsive kinetic 3D sculpture and SVG fallback. Pause rendering offscreen; respect reduced motion and WebGL failure.
- [ ] Restyle project panels, about, record and contact with intentional varied layouts and dark/orange tokens.
- [ ] Verify typecheck, existing tests, production prerender, desktop/mobile browser screenshots, interactions and reduced motion.
- [ ] Document the delivered visual system and limitations.

Review focus: narrow screen overflow; hydration; canvas failure; motion cleanup and accessibility; real demo behavior after presentation changes.
