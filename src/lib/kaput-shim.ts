/**
 * kaput is a Node package: on import it reads process.env and hooks process
 * signals. In a browser there is no `process`, so give it the few members it
 * touches, and turn its magic auto-init (http/net patching) off everywhere.
 * Must be imported before '@joint-ops/kaput'.
 */
type ProcessLike = { env: Record<string, string | undefined>; on(): void; off(): void; exit(): void; uptime(): number }
const g = globalThis as unknown as { process?: ProcessLike }
g.process ??= { env: {}, on() {}, off() {}, exit() {}, uptime: () => performance.now() / 1000 }
g.process.env.KAPUT_DISABLE_AUTO_INIT ??= '1'
// Vite's client build rewrites kaput's `process.env[...]` to `({})[...]`, so the flag above can't reach it and
// the auto-init runs anyway (against the inert http/net stubs). It calls setImmediate, which browsers lack.
const gi = globalThis as unknown as { setImmediate?: (fn: () => void) => unknown }
gi.setImmediate ??= (fn) => setTimeout(fn, 0)
