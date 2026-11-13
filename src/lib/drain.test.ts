import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRig } from './drain'

let log: string[]
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(Date.UTC(2026, 10, 12, 12))
  log = []
})
afterEach(() => vi.useRealTimers())

const run = async (p: Promise<void>, ms = 20_000) => {
  await vi.advanceTimersByTimeAsync(ms)
  await p
}

describe('createRig: the published kaput Kaput class, against stand-in resources', () => {
  it('closes in kaput’s priority order: HTTP first, databases last (whatever order they registered in)', async () => {
    const rig = createRig({ gracePeriod: 500, closeMs: 100, onLog: (l) => log.push(l) })
    await run(rig.shutdown())
    expect(log.filter((l) => l.includes('Resource closed:')).map((l) => l.split('Resource closed: ')[1].split(' {')[0])).toEqual([
      'HTTP Server (port 3000)',
      'BullMQ Worker (emails)',
      'Redis Client (ioredis)',
      'Prisma Client',
    ])
    expect(log.at(-1)).toContain('Graceful shutdown completed')
    expect(log.at(-1)).toMatch(/^\d{4}-\d\d-\d\dT.*Z \[kaput\] \[INFO\] /) // kaput's own format, ANSI stripped
  })

  it('in-flight requests finish; new ones are refused at the load balancer; nothing drops', async () => {
    const rig = createRig({ gracePeriod: 1000, closeMs: 50, onLog: (l) => log.push(l) })
    expect([rig.send(500), rig.send(1500), rig.send(2500)]).toEqual(['accepted', 'accepted', 'accepted'])
    const p = rig.shutdown()
    expect(rig.send(300)).toBe('refused')
    await run(p)
    expect(rig.stats()).toEqual({ inFlight: 0, served: 3, refused: 1, dropped: 0, phase: 'exited' })
  })

  it('a request that outlives the shutdown is counted as dropped (never assumed 0)', async () => {
    const rig = createRig({ gracePeriod: 200, closeMs: 50, timeout: 1000, onLog: (l) => log.push(l) })
    rig.send(10_000)
    await run(rig.shutdown(), 5000)
    expect(log.some((l) => l.includes('Failed to close resource: HTTP Server (port 3000)'))).toBe(true)
    expect(rig.stats()).toMatchObject({ dropped: 1, inFlight: 0, phase: 'exited' })
    await vi.advanceTimersByTimeAsync(10_000) // its timer fires later: still dropped, not served
    expect(rig.stats()).toMatchObject({ dropped: 1, served: 0 })
  })

  it('SIGTERM twice: kaput ignores the second', async () => {
    const rig = createRig({ gracePeriod: 200, closeMs: 50, onLog: (l) => log.push(l) })
    const p = rig.shutdown()
    const q = rig.shutdown()
    await run(Promise.all([p, q]).then(() => undefined))
    expect(log.some((l) => l.includes('Shutdown already in progress'))).toBe(true)
  })

  it('reports each resource and its state as kaput tracks it', async () => {
    const rig = createRig({ gracePeriod: 200, closeMs: 50 })
    expect(rig.resources().every((r) => r.state === 'active')).toBe(true)
    await run(rig.shutdown())
    expect(rig.resources().map((r) => r.state)).toEqual(['closed', 'closed', 'closed', 'closed'])
  })
})
