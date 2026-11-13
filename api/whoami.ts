// Vercel Edge Function: tells the page what the edge saw of this request.
// Headers are set by Vercel's network: https://vercel.com/docs/headers/request-headers
import { parseVercelId } from '../src/lib/observe'

export const config = { runtime: 'edge' }

export default function handler(req: Request): Response {
  const h = req.headers
  const { region, id } = parseVercelId(h.get('x-vercel-id'))
  const body = {
    id,
    region,
    city: h.get('x-vercel-ip-city') ?? '', // URL-encoded; the client decodes it
    country: h.get('x-vercel-ip-country') ?? '',
  }
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}
