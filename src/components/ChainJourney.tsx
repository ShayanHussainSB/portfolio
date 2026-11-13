import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { content } from '../content'
import { link, short } from '../lib/chain'
import { fallbackSrc, srcSet } from '../lib/photos'
import { progress, useProgressVar } from '../lib/scroll'

const c = content.chain
// a block whose art file isn't in src/assets/photos falls back to type only
const chain = link(c.blocks).map((b) => ({ ...b, art: b.art && srcSet(b.art, 'jpg') ? b.art : undefined }))
const LAST = chain.length - 1

/**
 * His Solana years as a chain the visitor flies through. The section pins; scroll moves a camera forward
 * through blocks stacked in depth (CSS reads --p and each block's --i). The block at the front "mines":
 * its hash scrambles, then settles on the real one.
 */
export function ChainJourney({ ctaHref }: { ctaHref: string }) {
  const pin = useRef<HTMLDivElement>(null)
  const [cur, setCur] = useState(0)
  useProgressVar(pin)

  // which block is at the front; React skips the render when it hasn't changed
  useEffect(() => {
    const el = pin.current
    if (!el) return
    let raf = 0
    const set = () => {
      raf = 0
      setCur(Math.round(progress(el) * LAST))
    }
    const on = () => void (raf ||= requestAnimationFrame(set))
    set()
    addEventListener('scroll', on, { passive: true })
    addEventListener('resize', on)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', on)
      removeEventListener('resize', on)
    }
  }, [])

  return (
    <section className="chain" id="chain" aria-labelledby="chain-title">
      <div className="chain__pin" ref={pin} style={{ '--n': chain.length } as CSSProperties}>
        <div className="chain__stage">
          <h2 id="chain-title" className="chain__title">
            <span className="mono">{c.kicker}</span>
            {c.title}
          </h2>
          <ol className="chain__blocks">
            {chain.map((b, i) => (
              <li key={b.hash} className="block" style={{ '--i': i } as CSSProperties} data-current={i === cur} data-art={b.art ? true : undefined}>
                <p className="block__meta mono" aria-hidden="true">
                  <span>
                    #{b.height} · {b.year}
                  </span>
                  <span>
                    hash <Hash hex={b.hash} mining={i === cur} />
                  </span>
                  <span>prev {short(b.prev)}</span>
                </p>
                <p className="sr-only">{c.blockOf(i + 1, chain.length, b.year)}</p>
                {b.art && (
                  <picture className="block__art">
                    <source type="image/avif" srcSet={srcSet(b.art, 'avif')} sizes="(max-width: 760px) 70vw, 40vw" />
                    <source type="image/webp" srcSet={srcSet(b.art, 'webp')} sizes="(max-width: 760px) 70vw, 40vw" />
                    <img src={fallbackSrc(b.art)} alt={b.alt} loading="lazy" decoding="async" width={1000} height={1000} />
                  </picture>
                )}
                <div className="block__words">
                  <h3>{b.headline}</h3>
                  <p>{b.line}</p>
                  {b.href && (
                    <a className="btn" href={b.href}>
                      {c.see}
                    </a>
                  )}
                  {b.cta && (
                    <p className="block__cta">
                      <a className="btn" href={ctaHref}>
                        {c.cta}
                      </a>
                      <a href={content.person.linkedin} rel="me noopener" target="_blank">
                        LinkedIn
                      </a>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

const HEX = '0123456789abcdef'

/** The short hash; while `mining`, it scrambles for 400 ms before settling (not under reduced motion). */
function Hash({ hex, mining }: { hex: string; mining: boolean }) {
  const real = short(hex)
  const [text, setText] = useState(real)
  useEffect(() => {
    if (!mining || matchMedia('(prefers-reduced-motion: reduce)').matches) return setText(real)
    const t0 = performance.now()
    const id = setInterval(() => {
      if (performance.now() - t0 >= 400) {
        clearInterval(id)
        return setText(real)
      }
      setText(real.replace(/[0-9a-f](?!x)/g, () => HEX[(Math.random() * 16) | 0]))
    }, 40)
    return () => clearInterval(id)
  }, [mining, real])
  return <>{text}</>
}
