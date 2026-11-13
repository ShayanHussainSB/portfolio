import { expect, test } from 'vitest'
import { scoreLead } from './quarry'

const kopi = [
  { rule: 'low_reply_rate', evidence: '14 of 19 1–2★ reviews unanswered' },
  { rule: 'rating_slipping', evidence: '3.6★ over the last 90 days vs 4.1★ all-time' },
  { rule: 'no_own_domain', evidence: 'Its website is https://www.instagram.com/kopicorner' },
  { rule: 'competitors_above', evidence: '2 of 3 competitors above you have a website; you don’t.' },
]
const reach = { phone: true, mobile: true, email: false, whatsapp: false, reviews: 219 }

test('reproduces the worked example in Quarry docs/scoring.md (Kopi Corner: 95, Hot, website_new)', () => {
  const s = scoreLead(kopi, reach)
  expect(s.fits).toMatchObject({ website_new: 75, reputation: 70, local_seo: 30, brand_identity: 20, ads_management: 10 })
  expect(s.priority).toBe(95)
  expect(s.label).toBe('Hot')
  expect(s.bucket).toBe('website_new')
  expect(s.pitch).toBe('Its website is https://www.instagram.com/kopicorner; 2 of 3 competitors above you have a website; you don’t.')
})

test('closed is always Cold with no bucket; a small unreachable place pays both penalties', () => {
  const closed = scoreLead([...kopi, { rule: 'closed', evidence: 'Marked closed on Maps' }], reach)
  expect(closed.bucket).toBeNull()
  expect(closed.label).toBe('Cold')
  const small = scoreLead(
    [
      { rule: 'no_website', evidence: 'No website on Maps' },
      { rule: 'few_reviews', evidence: '12 reviews on Maps' },
    ],
    { ...reach, phone: false, mobile: false, reviews: 12 },
  )
  // 70×0.6 + 15×0.25 = 45.75 − 15 − 15 = 15.75 → 16
  expect(small.priority).toBe(16)
  expect(small.penalties.map(([k]) => k)).toEqual(['no_contact', 'few_reviews'])
})
