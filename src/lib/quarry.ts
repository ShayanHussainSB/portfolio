/**
 * Quarry's lead score, ported from engine/src/quarry/parse/scoring.py `score()` (audit 1.9.0) with the
 * weights in config/services.toml, both on dev/shayan, 2026-11-12. The demo feeds it made-up facts.
 * ponytail: a hand copy of private code; re-copy the weights when services.toml changes.
 */
export const SERVICES: Record<string, Record<string, number>> = {
  website_new: { no_website: 70, no_own_domain: 70, expired_domain: 60, website_disappeared: 40, website_down: 30, competitors_above: 5 },
  website_redesign: { old_copyright: 35, not_mobile: 35, slow_pagespeed: 30, no_https: 30, ssl_problem: 20 },
  brand_identity: { new_business: 45, new_domain: 40, free_email: 30, no_own_domain: 20 },
  local_seo: { unclaimed: 40, competitors_above: 30, weak_seo: 30, just_claimed: 15, no_hours: 10 },
  reputation: { low_reply_rate: 40, low_rating: 35, rating_slipping: 30, rating_moved: 20, templated_replies: 20, few_reviews: 15, no_recent_reviews: 15 },
  ads_management: { sponsored_on_maps: 50, has_ad_tags: 45, competitors_above: 10 },
  social: { no_socials: 55, no_tracking: 15 },
  business_email: { free_email: 50, no_dmarc: 25, no_spf: 25, expiring_domain: 20 },
  booking_ordering: { no_booking_in_category: 60 },
}
export const BOOSTS = { email: 5, phone: 3, mobile: 5, whatsapp: 5, ads: 10, reviews_50: 10, reviews_200: 10 }
export const PENALTIES = { no_contact: 15, few_reviews: 15, closed_or_chain: 60 }

export interface Flag {
  rule: string
  evidence: string
}
export interface Reach {
  phone: boolean
  mobile: boolean
  email: boolean
  whatsapp: boolean
  reviews: number
}
export interface Score {
  priority: number
  label: 'Hot' | 'Warm' | 'Cold'
  bucket: string | null
  fits: Record<string, number>
  top: [string, number][]
  boosts: [string, number][]
  penalties: [string, number][]
  pitch: string
}

// Python's round() rounds halves to even; match it so a .5 lands where the engine puts it.
const roundEven = (x: number) => {
  const r = Math.round(x)
  return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r
}

export function scoreLead(flags: Flag[], reach: Reach): Score {
  const fired = new Set(flags.map((f) => f.rule))
  const fits = Object.fromEntries(
    Object.entries(SERVICES).map(([s, signals]) => [
      s,
      Math.min(
        100,
        Object.entries(signals).reduce((n, [r, p]) => n + (fired.has(r) ? p : 0), 0),
      ),
    ]),
  )
  // best fit first; a tie goes to the larger name, as Python's max over (fit, name) does
  const ranked = Object.entries(fits).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1))
  const top = ranked.slice(0, 3)
  let value = (top[0]?.[1] ?? 0) * 0.6 + (top[1]?.[1] ?? 0) * 0.25 + (top[2]?.[1] ?? 0) * 0.15

  const reached: Record<keyof typeof BOOSTS, boolean> = {
    email: reach.email,
    phone: reach.phone,
    mobile: reach.mobile,
    whatsapp: reach.whatsapp,
    ads: fired.has('has_ad_tags') || fired.has('sponsored_on_maps'),
    reviews_50: reach.reviews >= 50,
    reviews_200: reach.reviews >= 200,
  }
  const boosts = (Object.keys(BOOSTS) as (keyof typeof BOOSTS)[]).filter((k) => reached[k]).map((k) => [k, BOOSTS[k]] as [string, number])
  value += boosts.reduce((n, [, p]) => n + p, 0)

  const penalties: [string, number][] = []
  if (!(reach.phone || reach.email || reach.whatsapp) || (reach.reviews === 0 && !reach.phone)) penalties.push(['no_contact', PENALTIES.no_contact])
  if (fired.has('few_reviews')) penalties.push(['few_reviews', PENALTIES.few_reviews])
  const skip = fired.has('closed') || fired.has('chain') || fired.has('competitor_trade')
  if (skip) penalties.push(['closed_or_chain', PENALTIES.closed_or_chain])
  value -= penalties.reduce((n, [, p]) => n + p, 0)

  const priority = Math.max(0, Math.min(100, roundEven(value)))
  const bucket = skip || !ranked[0][1] ? null : ranked[0][0]
  const signals = bucket ? SERVICES[bucket] : {}
  const pitch = flags
    .filter((f) => f.rule in signals)
    .sort((a, b) => signals[b.rule] - signals[a.rule])
    .slice(0, 2)
    .map((f) => f.evidence)
    .join('; ')
  return { priority, label: priority >= 70 ? 'Hot' : priority >= 50 ? 'Warm' : 'Cold', bucket, fits, top, boosts, penalties, pitch }
}
