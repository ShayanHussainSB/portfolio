import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { buildTree, hex, leafHash, proofFor, verify } from '../lib/merkle'
import { fallbackSrc } from '../lib/photos'

const crew = [
  { name: 'Scout', art: 'chain-solpatrol', role: 'Fast routes' },
  { name: 'Engineer', art: 'journey-madlads-1', role: 'Finds resources' },
  { name: 'Navigator', art: 'journey-madlads-2', role: 'Opens new paths' },
]
const destinations = [
  { name: 'Crystal grove', resource: 'crystals', reward: 3 },
  { name: 'Signal ruins', resource: 'relics', reward: 5 },
  { name: 'Sky harbour', resource: 'cores', reward: 8 },
]
export function MissionExample() {
  const [selected, setSelected] = useState(0),
    [destination, setDestination] = useState(0),
    [phase, setPhase] = useState<'ready' | 'travel' | 'loot'>('ready'),
    [progress, setProgress] = useState(0),
    [bag, setBag] = useState(0)
  const character = crew[selected],
    place = destinations[destination]
  useEffect(() => {
    if (phase !== 'travel') return
    const start = performance.now()
    let raf = 0
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / (reduced ? 100 : 2600))
      setProgress(p)
      if (p < 1) raf = requestAnimationFrame(tick)
      else setPhase('loot')
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase])
  const launch = () => {
    setProgress(0)
    setPhase('travel')
  }
  return (
    <div className="journey-demo expedition" data-phase={phase}>
      <div className="expedition__head">
        <span>Playable model · no wallet needed</span>
        <b>
          Inventory <strong>{bag}</strong>
        </b>
      </div>
      <div
        className="expedition__world"
        style={{ '--travel': progress, '--dx': `${[35, 65, 89][destination]}%`, '--dy': `${[-7, 4, -20][destination]}%` } as CSSProperties}
      >
        <svg viewBox="0 0 500 190" fill="none" aria-hidden="true">
          <path className="expedition__terrain" d="M0 160L55 105 102 143 165 35 240 125 290 78 342 140 415 45 500 132V190H0Z" />
          <path className="expedition__trail" d="M35 148 C115 170 110 60 190 90 S300 175 340 110 S400 42 460 65" />
          {[0, 1, 2].map((n) => (
            <g
              key={n}
              className={n === destination ? 'expedition__beacon is-selected' : 'expedition__beacon'}
              transform={`translate(${[190, 340, 460][n]},${[90, 110, 65][n]})`}
            >
              <circle r="15" />
              <path d="M0 -8L6 0 0 8 -6 0Z" />
            </g>
          ))}
        </svg>
        <div className="expedition__traveller">
          <img src={fallbackSrc(character.art)} alt={character.name} />
          <span>{phase === 'loot' ? 'Loot found!' : phase === 'travel' ? 'Exploring…' : 'Your character'}</span>
        </div>
        {phase === 'loot' && (
          <div className="expedition__loot" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => (
              <i key={i} style={{ '--i': i } as CSSProperties} />
            ))}
          </div>
        )}
      </div>
      <div className="expedition__choices" role="group" aria-label="Choose your character">
        {crew.map((c, i) => (
          <button key={c.name} disabled={phase !== 'ready'} aria-pressed={i === selected} onClick={() => setSelected(i)}>
            <img src={fallbackSrc(c.art)} alt="" />
            <span>
              {c.name}
              <small>{c.role}</small>
            </span>
          </button>
        ))}
      </div>
      <div className="expedition__destinations" role="group" aria-label="Choose a destination">
        {destinations.map((d, i) => (
          <button key={d.name} disabled={phase !== 'ready'} aria-pressed={i === destination} onClick={() => setDestination(i)}>
            {d.name}
            <span>
              +{d.reward} {d.resource}
            </span>
          </button>
        ))}
      </div>
      <div className="expedition__status">
        <p role="status">
          {phase === 'ready'
            ? 'Choose a character and a place. Then explore.'
            : phase === 'travel'
              ? `${character.name} is travelling. Ownership stays with you; mission state is locked.`
              : `${character.name} found ${place.reward} ${place.resource}. Claim them to unlock the next expedition.`}
        </p>
        <button
          className="btn"
          disabled={phase === 'travel'}
          onClick={
            phase === 'loot'
              ? () => {
                  setBag(bag + place.reward)
                  setPhase('ready')
                  setProgress(0)
                }
              : launch
          }
        >
          {phase === 'travel'
            ? `Exploring ${Math.round(progress * 100)}%`
            : phase === 'loot'
              ? `Claim ${place.reward} ${place.resource}`
              : 'Launch expedition →'}
        </button>
      </div>
    </div>
  )
}
export function CompressionExample() {
  const [packed, setPacked] = useState(false),
    [tampered, setTampered] = useState(false),
    [checked, setChecked] = useState(false)
  const levels = useMemo(() => buildTree(Array.from({ length: 64 }, (_, i) => leafHash(`example character ${i}`))), [])
  const proof = proofFor(levels, 7),
    ok = verify(`example character 7${tampered ? ' changed' : ''}`, 7, proof.siblings, levels.at(-1)![0]).ok
  return (
    <div className="journey-demo compression-play" data-packed={packed} data-valid={ok}>
      <p className="journey-demo__note">64 example records · real Merkle verification</p>
      <div className="compression-play__space" aria-hidden="true">
        <div className="compression-play__records">
          {Array.from({ length: 64 }, (_, i) => (
            <i key={i} style={{ '--x': i % 8, '--y': Math.floor(i / 8), '--delay': `${i * 0.004}s` } as CSSProperties} />
          ))}
        </div>
        <div className="compression-play__root">
          <span>64</span>
          <b>one root</b>
        </div>
        <svg viewBox="0 0 300 220">
          <path d="M42 190 Q65 70 150 110 T258 35" />
        </svg>
      </div>
      <h3>
        {!packed
          ? 'A world of records.'
          : checked
            ? ok
              ? 'Still yours. Still verifiable.'
              : 'One change. A broken proof.'
            : 'One root. Every record accounted for.'}
      </h3>
      <p>
        {!packed
          ? 'Fold the records together. You keep the ability to prove any one belongs.'
          : checked
            ? ok
              ? 'The original record passes its proof against the root.'
              : 'The changed record cannot produce the same root.'
            : 'The root is a commitment to the records. The individual data stays available off-chain.'}
      </p>
      <div className="journey-demo__actions">
        {!packed ? (
          <button className="btn" onClick={() => setPacked(true)}>
            Fold into one root →
          </button>
        ) : (
          <>
            <button className="btn" onClick={() => setChecked(true)}>
              Verify a record
            </button>
            <button
              className="btn"
              aria-pressed={tampered}
              onClick={() => {
                setTampered(!tampered)
                setChecked(true)
              }}
            >
              {tampered ? 'Restore record' : 'Change its data'}
            </button>
            <button
              className="compression-play__reset"
              onClick={() => {
                setPacked(false)
                setChecked(false)
                setTampered(false)
              }}
              aria-label="Unfold the records"
            >
              ↶
            </button>
          </>
        )}
      </div>
      <output className="sr-only" aria-live="polite">
        {checked ? (ok ? 'Proof verified' : 'Proof rejected') : packed ? 'Records folded into one root' : '64 records ready'}
      </output>
      {checked && <code className="compression-play__hash">root / {hex(levels.at(-1)![0], 8)}…</code>}
    </div>
  )
}
export { StreamExample } from './AssetPipelineExample'
export { SdkExample } from './SdkExample'
