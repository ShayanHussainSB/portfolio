/**
 * The kaput demo runs the published kaput `Kaput` class in the visitor's tab. Its
 * resources are stand-ins shaped like the real clients, so kaput's own
 * detectors recognise, name and order them. The drain works as in production:
 * once shutdown starts, readiness fails and the load balancer stops routing;
 * server.close() then waits for the requests already in flight.
 */
import './kaput-shim'
import { Kaput, KaputLogger, resetKaputInstance } from '@joint-ops/kaput'

// importing kaput creates a default instance that hooks signals; this rig runs its own
resetKaputInstance()

type Level = 'info' | 'warn' | 'error'
const ANSI = /\x1b\[\d+m/g // eslint-disable-line no-control-regex
const format = new KaputLogger('info') as unknown as { formatMessage(level: string, message: string, meta?: Record<string, unknown>): string }

export type Phase = 'serving' | 'draining' | 'closing' | 'exited'

export interface RigOptions {
  /** kaput's grace period (its default is 10 s). */
  gracePeriod?: number
  /** How long each stand-in client takes to close. */
  closeMs?: number
  /** Per-resource close timeout (kaput's default is 30 s). */
  timeout?: number
  onLog?: (line: string) => void
  onChange?: () => void
}

export function createRig({ gracePeriod = 2000, closeMs = 300, timeout = 30_000, onLog, onChange }: RigOptions = {}) {
  let live = 0
  let served = 0
  let refused = 0
  let dropped = 0
  let phase: Phase = 'serving'
  let whenEmpty: (() => void) | null = null
  const timers = new Set<ReturnType<typeof setTimeout>>()
  const changed = () => onChange?.()

  const line = (level: Level) => (message: string, meta?: Record<string, unknown>) => {
    onLog?.(format.formatMessage(level, message, meta).replace(ANSI, ''))
    changed()
  }
  const k = new Kaput({
    signals: [],
    exitProcess: false,
    forceExitTimeout: 0,
    gracePeriod,
    timeout,
    logger: { debug() {}, info: line('info'), warn: line('warn'), error: line('error') },
  })
  k.on({
    onDraining: () => void ((phase = 'draining'), changed()),
    onClosing: () => void ((phase = 'closing'), changed()),
  })

  const later = () => new Promise<void>((r) => setTimeout(r, closeMs))
  // stand-ins, registered "wrong" (database first) so kaput's ordering shows
  class Worker {
    name = 'emails'
    close = later
  }
  Object.defineProperty(Worker, 'name', { value: 'Worker' }) // kaput reads constructor.name; survive minification
  const server = {
    listening: true,
    listen() {},
    address: () => ({ port: 3000 }),
    close(cb: (err?: Error) => void) {
      server.listening = false
      if (live === 0) cb()
      else whenEmpty = () => cb()
    },
  }
  k.register({ $disconnect: later } as never)
  k.register({ status: 'ready', quit: later } as never)
  k.register(new Worker())
  k.register(server as never)

  return {
    /** A request from the visitor's traffic. Refused once readiness fails (kaput is shutting down). */
    send(durationMs: number): 'accepted' | 'refused' {
      if (k.isShutdown()) {
        refused++
        changed()
        return 'refused'
      }
      live++
      const t = setTimeout(() => {
        timers.delete(t)
        if (phase === 'exited') return // already counted as dropped
        live--
        served++
        if (live === 0 && whenEmpty) {
          const done = whenEmpty
          whenEmpty = null
          done()
        }
        changed()
      }, durationMs)
      timers.add(t)
      changed()
      return 'accepted'
    },
    /** Send SIGTERM. A second call is kaput's to ignore. */
    async shutdown() {
      const first = !k.isShutdown()
      await k.shutdown('SIGTERM')
      if (!first) return
      dropped += live // whatever is still in flight when the process exits is lost
      live = 0
      phase = 'exited'
      changed()
    },
    stats: () => ({ inFlight: live, served, refused, dropped, phase }),
    /** kaput's resources in its close order, with the state it tracks for each. */
    resources: () =>
      k
        .getResources()
        .sort((a, b) => a.order - b.order)
        .map((r) => ({ name: r.name, state: r.state })),
    dispose() {
      timers.forEach(clearTimeout)
      timers.clear()
      k.destroy()
    },
  }
}

export type Rig = ReturnType<typeof createRig>
