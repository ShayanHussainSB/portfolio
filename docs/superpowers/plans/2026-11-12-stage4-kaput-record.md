# Stage 4: kaput Kill Switch, Record, Response Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sheet 05 (kaput) runs the published kaput `Kaput` class in the tab against the visitor's live traffic. The visitor flips a covered switch and watches the drain finish with **dropped: 0**, then the off-call photo appears. Sheet 07 (Record) is a revision table built only from verified facts. Sheet 08's status line moves into its headers block.

**Architecture:**
- `lib/drain.ts` installs a minimal `process` shim (auto-init off), imports `@joint-ops/kaput`, and drops the module's default instance.
- It builds a rig: one `Kaput({ signals: [], exitProcess: false, gracePeriod: 2000, logger })` plus duck-typed stand-ins that kaput's own detectors recognise:
  - an HTTP server (port 3000)
  - a BullMQ `Worker` ("emails")
  - an ioredis-style `Redis`
  - a Prisma client
- The drain works the way kaput does in production. Once shutdown starts, readiness fails, so the load balancer stops routing. Then `server.close()` waits for in-flight requests.
- `KaputStop` lazy-loads `drain.ts` the first time the sheet is in view.

**Tech Stack:** Stage 3's stack, plus `@joint-ops/kaput@0.1.0`.

**Spec:** `docs/design.md` §3 stops 05, 07 and 08. Shayan's rulings from 2026-11-12: Record uses verified facts only (no dates or employers); the CV and testimonials stay hidden until supplied; Sheet 08's status line moves into its headers block.

## Global Constraints

- Everything in the Stage 1–3 plans still applies.
- **Truth:**
  - **Close order is kaput's real priority order:** HTTP (10) → BullMQ (30) → Redis (50) → Prisma (60). The spec's "Prisma → Redis → BullMQ" is reversed, so `design.md` gets corrected.
  - **The log lines are kaput's own logger output,** formatted by the real `KaputLogger.formatMessage` with the ANSI codes stripped.
  - **Stand-ins are labelled as stand-ins.** The `gracePeriod` is shortened to 2 s (kaput's default is 10 s), and the pull-out says so.
  - **Code line:** `import '@joint-ops/kaput'` (the README's zero-config usage, with the real package name).
  - **Facts:** zero-config; auto-detects Express, Fastify, Prisma, Redis, BullMQ, Mongoose and Knex; `/health` and `/healthz` endpoints.
  - **Record:** no years beyond "Sandstorm 2023" (verified), no employers, no titles. The revision order gets `TODO(Shayan): confirm order`.
- **Escalation:** the switch moves from calm, to a hatched border (cover up), to a full `--fault` switch (SIGTERM sent).
- **Haptics:** `navigator.vibrate?.(30)` on the flip.

## Review Focus

1. **The visitor tries to send a request mid-drain.** It's refused at the load balancer (counted as refused, not dropped), never served by a closing server. → Task 1 test.
2. **A request outlives the shutdown.** dropped must be computed, never hard-coded to 0. → Task 1 test, with a stand-in close that times out.
3. **SIGTERM pressed twice.** kaput logs "Shutdown already in progress" and nothing restarts. → Task 1 test.
4. **SSR or the build process importing kaput.** It would hook real signals. → kaput is only ever loaded through a client-side dynamic import, checked with a grep of `dist-ssr`.
5. **Restart after exit.** A fresh rig: counters reset, and the old one's timers can't touch the new one. → Task 2 browser check.

---

### Task 1: The drain rig (real kaput)

**Files:**
- Run: `bun add @joint-ops/kaput@0.1.0 --exact`
- Create: `src/lib/kaput-shim.ts` (`globalThis.process ??= {…}` and `process.env.KAPUT_DISABLE_AUTO_INIT ??= '1'`)
- Create: `src/lib/drain.ts`, `src/lib/drain.test.ts`

**Interfaces:**
- `createRig({ gracePeriod?: number, closeMs?: number, onLog?: (line: string) => void, onChange?: () => void })` returns:
  - `send(durationMs): 'accepted' | 'refused'`
  - `shutdown(): Promise<void>`
  - `stats(): { inFlight, served, refused, dropped, phase: 'serving' | 'draining' | 'closing' | 'exited' }`
  - `resources(): { name: string; state: string }[]`
  - `dispose()`

- [ ] **Step 1: Write the failing tests.** Use fake timers; the rig registers Prisma, Redis, Worker and Server in that order.
  - **Close order:** after the shutdown resolves, the logged "Resource closed: …" lines read HTTP Server (port 3000), BullMQ Worker (emails), Redis Client (ioredis), Prisma Client.
  - **Drain:** send(500), send(1500) and send(2500), then shut down with gracePeriod 1000:
    - a send during the drain → `'refused'`
    - at the end: served 3, dropped 0, refused 1, phase `'exited'`
    - the last log line contains "Graceful shutdown completed"
  - **Timeout:** with `closeMs` set beyond the resource timeout (pass `timeout` through), the in-flight count left at exit becomes `dropped`, and the log contains "Failed to close resource".
  - **Second shutdown:** a second `shutdown()` logs "Shutdown already in progress".
- [ ] **Step 2:** Run `bunx vitest run src/lib/drain.test.ts`. Expected: FAIL (the module is missing).
- [ ] **Step 3: Implement `kaput-shim.ts` and `drain.ts`.**
- [ ] **Step 4:** Run the tests again. Expected: PASS. Then run the full suite.

### Task 2: Sheet 05, kaput kill switch

**Files:**
- Create: `src/components/KaputStop.tsx`
- Modify: `content.ts` (`stops.kaput`), `App.tsx`, `app.css`

**Panel layout:**
- **Lane:** an SVG with the load balancer gate on the left (solid while ready; dashed or hatched while draining), the server lane, and the visitor's requests as fringe droplets crossing the lane over their real durations.
- **Counters** (mono): in flight, served, refused, dropped.
- **Resource list:** taken from `rig.resources()`, showing active → draining → closed.
- **Log:** kaput's own lines, in `<pre>`, with `aria-live` on the latest line only.
- **Switch:** a cover button with `aria-expanded`, then a SIGTERM button (disabled until the cover is up).
- **After exit:** the `offcall` photo is revealed with the caption "exit 0 · on-call: off", plus a "Restart server" button.
- **Traffic:** a request every 250 ms, lasting 600–3,000 ms, while the sheet is in view and serving.
- **Reduced motion:** no droplet travel. The counters and log still update.

- [ ] **Step 1: Build the component.**
- [ ] **Step 2: Check it in a browser.**
  - Flip the switch: the log order matches Task 1, dropped is 0, and the photo appears.
  - Restart: the counters reset.
  - Check desktop and phone, both themes, reduced motion, and keyboard (cover → SIGTERM → restart).
  - Run `grep -c kaput dist-ssr` after the build: the entry must contain no static import of it.

### Task 3: Sheet 07 Record + Sheet 08 status line

**Files:**
- Create: `src/components/RecordStop.tsx`
- Modify: `StopSheet.tsx` (`code` becomes optional), `Response.tsx`, `content.ts` (`stops.record`), `App.tsx`, `app.css`

**Content:**
- **Revisions** (a real `<table>` with REV and Change columns, in title-block style):
  - A: 7+ years of backend
  - B: Sandstorm 2023 (winner)
  - C: Grizzlython (3rd)
  - D: Civic Hackathon (winner)
  - E: Honeycomb
  - F: GameShift
  - G: JointOps open source (current; matches the hero's "Rev G")
- **Stack line:** TypeScript · Node.js · Bun · NestJS · GraphQL · WebSockets (each one evidenced by a project).
- `cv: null` and `testimonials: []`, each rendered only when supplied.
- **Sheet 08:** remove `.response__status` above the heading. The headers `<dl>` gains a first row with the status line (`HTTP/1.1 200 OK`).

- [ ] **Step 1: Build Record, move the Sheet 08 status line, and make `code` optional.**
- [ ] **Step 2: Check it.** Desktop and phone, both themes; the detector shows no kicker finding.

### Task 4: Finish the stage

- [ ] **Step 1:** Run `bun run test && bun run typecheck && bun run build`. All three must pass, and every stop must be prerendered.
- [ ] **Step 2:** Run the matrix, the detector and a Tab pass.
- [ ] **Step 3:** Update the README, correct the stops 05/07/08 rows in `design.md`, and write the ledger.
