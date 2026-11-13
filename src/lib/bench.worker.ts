/// <reference lib="webworker" />
// One second of the real hitlimit middleware, off the main thread.
import { hitlimit } from '@joint-ops/hitlimit'
import { runFor } from './bench'
import { exchange } from './limiter'

const mw = hitlimit({ limit: 100, window: '1m' })
const ips = Array.from({ length: 1024 }, (_, i) => `10.0.${i >> 8}.${i & 255}`)
let i = 0
const checks = runFor(1000, () => void exchange(mw, ips[i++ & 1023]), () => performance.now())
postMessage({ checks })
