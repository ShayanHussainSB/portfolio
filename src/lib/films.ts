/**
 * The bunWay demo runs the published bunway@1.1.0 middleware files, unmodified, in the
 * visitor's tab: the four that set response headers and need no Bun or Node APIs.
 * (logger and session need Bun file I/O / node:crypto, so they're not faked here.)
 */
import { cors } from 'bunway/middleware/cors'
import { helmet } from 'bunway/middleware/helmet'
import { requestId } from 'bunway/middleware/request-id'
import { responseTime } from 'bunway/middleware/response-time'

export const LAYERS = ['cors', 'helmet', 'requestId', 'responseTime'] as const
export type Layer = (typeof LAYERS)[number]

// bunway's handler types name its Bun request/response; we pass the slice of them these four use
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (req: any, res: any, next: () => void) => void

const HANDLERS: Record<Layer, Handler> = {
  cors: cors() as Handler,
  helmet: helmet() as Handler,
  requestId: requestId() as Handler,
  responseTime: responseTime() as Handler,
}

/** One GET through the enabled layers, in order. A layer that throws is reported and skipped. */
export function runChain(on: Record<Layer, boolean>, origin: string) {
  const reqHeaders: Record<string, string> = { origin }
  const req = { method: 'GET', get: (name: string) => reqHeaders[name.toLowerCase()] }
  const out = new Map<string, [string, string]>() // lower-case key → [name as set, value]
  const res = {
    set(name: string, value: string) {
      out.set(name.toLowerCase(), [name, String(value)])
      return res
    },
    get: (name: string) => out.get(name.toLowerCase())?.[1],
    status: () => res,
    send: () => res,
    toResponse: () => undefined,
  }
  const errors: Partial<Record<Layer, string>> = {}
  for (const layer of LAYERS) {
    if (!on[layer]) continue
    try {
      HANDLERS[layer](req, res, () => undefined)
    } catch (e) {
      errors[layer] = e instanceof Error ? e.message : String(e)
    }
  }
  res.toResponse() // responseTime wraps this to stamp X-Response-Time, as bunway does before sending
  return { headers: [...out.values()], errors }
}
