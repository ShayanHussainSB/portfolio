import { useRef, type CSSProperties, type ReactNode } from 'react'
import { content } from '../content'
import { useProgressVar } from '../lib/scroll'
import { Strip } from './Strip'

/**
 * A featured project's opening: a pinned stage that scroll scrubs. The name is a window onto the project's
 * film; scrolling zooms through it until the film fills the screen, then the vision is set over it.
 * The project itself (children) follows in normal flow, so its demo is never clipped by the pin.
 */
export function Scene({ id, children }: { id: keyof typeof content.projects; children: ReactNode }) {
  const pin = useRef<HTMLDivElement>(null)
  useProgressVar(pin)
  const x = content.projects[id]
  return (
    <div className="scene" data-project={id}>
      <div className="scene__pin" ref={pin}>
        <div className="scene__stage">
          <Strip id={id} film />
          <div className="scene__mask" aria-hidden="true">
            <b style={{ '--n': x.name.length } as CSSProperties}>{x.name}</b>
          </div>
          <div className="scene__say">
            <p className="scene__kind">
              <b>{x.kind}</b>
              <span>{x.note}</span>
            </p>
            <p className="scene__vision">{x.vision}</p>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
