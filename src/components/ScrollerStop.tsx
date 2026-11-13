import { useEffect, useRef, useState } from 'react'
import { content } from '../content'
import { StopSheet } from './StopSheet'

type Mode = keyof typeof content.stops.scroller.modes

/**
 * scroller. A sandboxed page runs the extension's real content scripts
 * (public/scroller/); these controls talk to it the way the popup does.
 */
export function ScrollerStop() {
  const c = content.stops.scroller
  const frame = useRef<HTMLIFrameElement>(null)
  const [pxs, setPxs] = useState(40)
  const [running, setRunning] = useState(false)
  const [mode, setMode] = useState<Mode>('smooth')

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return
      const m = e.data?.scroller
      if (typeof m?.pxs === 'number') setPxs(m.pxs)
      if (typeof m?.running === 'boolean') setRunning(m.running)
    }
    addEventListener('message', onMsg)
    return () => removeEventListener('message', onMsg)
  }, [])

  const send = (msg: object) => frame.current?.contentWindow?.postMessage(msg, '*')
  // sites: {} so a preset also replaces whatever [ and ] saved for the page
  const setSpeed = (v: number) => send({ set: { pxs: v, sites: {} } })
  const pickMode = (m: Mode) => {
    setMode(m)
    send({ set: { mode: m } })
  }

  return (
    <StopSheet
      id="scroller"
      headline={c.headline}
      sentence={c.sentence}
      code={c.code}
      details={
        <>
          <ul>
            {c.details.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <p className="stop__install">
            <a href={c.site}>{c.siteLabel}</a> · <a href={c.repo}>{c.repoLabel}</a>
          </p>
        </>
      }
      panel={
        <div className="sheet sc">
          <iframe ref={frame} className="sc__page" src="/scroller/reader.html" title={c.frameTitle} sandbox="allow-scripts" loading="lazy" />
          <div className="sc__controls">
            <button type="button" className="btn btn--solid" onClick={() => send({ toggle: true })}>
              {running ? c.stop : c.start}
            </button>
            <button type="button" className="btn" onClick={() => send({ top: true })}>
              {c.top}
            </button>
            <output className="sc__readout" aria-live="polite">
              {c.readout(pxs, running)}
            </output>
          </div>
          <fieldset className="sc__group">
            <legend>{c.speedLabel}</legend>
            {c.presets.map(([name, v]) => (
              <button key={v} type="button" className="btn" aria-pressed={pxs === v} onClick={() => setSpeed(v)}>
                {name}
              </button>
            ))}
          </fieldset>
          <fieldset className="sc__group">
            <legend>{c.modeLabel}</legend>
            {(Object.keys(c.modes) as Mode[]).map((m) => (
              <button key={m} type="button" className="btn" aria-pressed={mode === m} onClick={() => pickMode(m)}>
                {c.modes[m]}
              </button>
            ))}
          </fieldset>
          <p className="sc__keys">{c.keys}</p>
        </div>
      }
    />
  )
}
