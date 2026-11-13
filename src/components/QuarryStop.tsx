import { useMemo, useState } from 'react'
import { content } from '../content'
import { scoreLead, type Flag } from '../lib/quarry'
import { StopSheet } from './StopSheet'

type Site = 'own' | 'social' | 'none'
type Fact = keyof typeof content.stops.quarry.facts

// Evidence lines are the examples in Quarry's docs/scoring.md.
const EVIDENCE: Record<string, string> = {
  no_website: 'No website on Maps',
  no_own_domain: 'Its website is https://www.instagram.com/kopicorner',
  old_copyright: 'Footer says © 2019',
  not_mobile: 'No viewport tag: the site isn’t built for phones',
  rating_slipping: '3.6★ over the last 90 days vs 4.1★ all-time',
  low_reply_rate: '14 of 19 1–2★ reviews unanswered',
  free_email: 'Uses kopicorner@gmail.com',
  unclaimed: 'Nobody has claimed the Maps listing',
  closed: 'Marked closed on Maps',
}

/** Quarry (coming next). Kopi Corner, the doc's made-up café: change a fact, the real formula re-scores it. */
export function QuarryStop() {
  const q = content.stops.quarry
  const [site, setSite] = useState<Site>('social')
  const [reviews, setReviews] = useState(219)
  const [on, setOn] = useState<Record<Fact, boolean>>({
    old_copyright: false,
    not_mobile: false,
    rating_slipping: true,
    low_reply_rate: true,
    mobile: true,
    free_email: false,
    competitors_above: true,
    unclaimed: false,
    closed: false,
  })
  const flip = (f: Fact) => setOn((o) => ({ ...o, [f]: !o[f] }))
  const disabled = (f: Fact) => (f === 'low_reply_rate' && reviews <= 30) || ((f === 'old_copyright' || f === 'not_mobile') && site !== 'own')

  const { score, flags } = useMemo(() => {
    const fl: Flag[] = []
    const add = (rule: string, evidence = EVIDENCE[rule]) => fl.push({ rule, evidence })
    if (site === 'none') add('no_website')
    if (site === 'social') add('no_own_domain')
    if (site === 'own' && on.old_copyright) add('old_copyright')
    if (site === 'own' && on.not_mobile) add('not_mobile')
    if (on.free_email) add('free_email')
    if (on.unclaimed) add('unclaimed')
    if (reviews < 20) add('few_reviews', `${reviews} reviews on Maps`)
    if (on.low_reply_rate && reviews > 30) add('low_reply_rate')
    if (on.rating_slipping) add('rating_slipping')
    if (on.competitors_above)
      add('competitors_above', site === 'own' ? 'Kafe Seri shows above you in 7 of 9 searches' : '2 of 3 competitors above you have a website; you don’t.')
    if (on.closed) add('closed')
    const reach = { phone: on.mobile, mobile: on.mobile, email: on.free_email, whatsapp: false, reviews }
    return { score: scoreLead(fl, reach), flags: fl }
  }, [site, reviews, on])

  const top = score.top.filter(([, v]) => v > 0)
  const base = top.map(([, v], i) => `${v}×${[0.6, 0.25, 0.15][i]}`).join(' + ') || '0'
  const plus = score.boosts.map(([k, p]) => ` + ${q.boostNames[k]} ${p}`).join('')
  const minus = score.penalties.map(([k, p]) => ` − ${q.penaltyNames[k]} ${p}`).join('')

  return (
    <StopSheet
      id="quarry"
      headline={q.headline}
      sentence={q.sentence}
      code={q.code}
      details={
        <ul>
          {q.details.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      }
      panel={
        <div className="sheet qy">
          <header className="qy__biz">
            <b>{q.business}</b>
            <span>{q.madeUp}</span>
          </header>
          <div className="qy__body">
            <fieldset className="qy__facts">
              <legend>{q.factsLabel}</legend>
              <div role="radiogroup" aria-label={q.website.label} className="qy__seg">
                <span>{q.website.label}</span>
                {(['own', 'social', 'none'] as Site[]).map((s) => (
                  <button key={s} type="button" role="radio" aria-checked={site === s} className="btn" onClick={() => setSite(s)}>
                    {q.website[s]}
                  </button>
                ))}
              </div>
              <div role="radiogroup" aria-label={q.reviews.label} className="qy__seg">
                <span>{q.reviews.label}</span>
                {q.reviews.counts.map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={reviews === n} className="btn" onClick={() => setReviews(n)}>
                    {n}
                  </button>
                ))}
              </div>
              {(Object.keys(q.facts) as Fact[]).map((f) => (
                <label key={f} className="qy__fact" data-off={disabled(f) || undefined}>
                  <input type="checkbox" checked={on[f] && !disabled(f)} disabled={disabled(f)} onChange={() => flip(f)} />
                  {q.facts[f]}
                  {f === 'low_reply_rate' && reviews <= 30 && <small> {q.needsReviews}</small>}
                </label>
              ))}
            </fieldset>
            <div className="qy__out">
              <p className="qy__score" data-label={score.label}>
                <span>{q.priority}</span>
                <b>{score.priority}</b>
                <mark>{score.label}</mark>
              </p>
              <p className="qy__sell">
                {score.bucket ? (
                  <>
                    <span>{q.sellThem}</span> {q.services[score.bucket]}
                  </>
                ) : (
                  q.noBucket
                )}
              </p>
              {score.pitch && (
                <p className="qy__pitch">
                  <span>{q.pitch}</span> “{score.pitch}”
                </p>
              )}
              <p className="qy__working" aria-label={q.working}>
                {base}
                {plus}
                {minus} = {score.priority}
              </p>
              <ul className="qy__flags" aria-label={q.flagsLabel}>
                {flags.map((f) => (
                  <li key={f.rule}>
                    <code>{f.rule}</code> {f.evidence}
                  </li>
                ))}
              </ul>
              <p className="sr-only" aria-live="polite">
                {q.announce(score.priority, score.label)}
              </p>
            </div>
          </div>
        </div>
      }
    />
  )
}
