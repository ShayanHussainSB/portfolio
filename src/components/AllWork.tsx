import { Fragment, useEffect, useRef, type CSSProperties, type ReactElement } from 'react'
import { content } from '../content'
import { BunwayStop } from './BunwayStop'
import { HitlimitStop } from './HitlimitStop'
import { KaputStop } from './KaputStop'
import { QuarryStop } from './QuarryStop'
import { ScrollerStop } from './ScrollerStop'
import { StateStop } from './StateStop'
import { InAll } from './StopSheet'
import { UsherStop } from './UsherStop'

type Id = keyof typeof content.projects
const STOPS: Record<Id, () => ReactElement> = {
  hitlimit: HitlimitStop,
  bunway: BunwayStop,
  state: StateStop,
  kaput: KaputStop,
  scroller: ScrollerStop,
  usher: UsherStop,
  quarry: QuarryStop,
}
const ids = Object.keys(STOPS) as Id[]
const a = content.all

/** The main page's list of everything, as a directory listing. Every row opens the "See all" screen at that project. */
export function Index() {
  return (
    <section className="index" aria-labelledby="index-title">
      <h2 id="index-title" className="sr-only">
        {a.title}
      </h2>
      <p className="index__cmd mono">
        <span aria-hidden="true">$ </span>
        {a.command}
      </p>
      <ul>
        {ids.map((id) => (
          <li key={id} data-project={id}>
            <a href={`#all-${id}`}>
              <b>{content.projects[id].name}</b>
              <span>{content.projects[id].kind}</span>
              <span>{content.projects[id].note}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="index__sum">{a.summary(ids.length, content.featured.length)}</p>
      <a className="index__all" href="#all">
        <b>{a.seeAll}</b>
        <span className="mono" aria-hidden="true">
          $ {a.seeAllCommand}
          <i />
        </span>
      </a>
    </section>
  )
}

/** Every project, running, in one full-screen sheet. `target` is null (closed), 'all', or the project to land on. */
export function AllWork({ target, onClose }: { target: string | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  // the sheet opens as an iris from wherever the visitor last pressed
  useEffect(() => {
    const mark = (e: PointerEvent) => {
      ref.current?.style.setProperty('--x', `${e.clientX}px`)
      ref.current?.style.setProperty('--y', `${e.clientY}px`)
    }
    addEventListener('pointerdown', mark)
    return () => removeEventListener('pointerdown', mark)
  }, [])

  useEffect(() => {
    const d = ref.current!
    if (!target) return void (d.open && d.close())
    if (!d.open) {
      d.showModal()
      d.focus() // not the first project link, which would look selected
    }
    if (target === 'all') d.scrollTop = 0
    else document.getElementById(`all-${target}`)?.scrollIntoView()
  }, [target])

  return (
    <dialog className="all" ref={ref} tabIndex={-1} onClose={onClose} aria-labelledby="all-title">
      <header className="all__bar">
        <h2 id="all-title">{a.title}</h2>
        <nav aria-label={a.title}>
          {ids.map((id, i) => (
            <a key={id} href={`#all-${id}`} data-project={id} style={{ '--i': i } as CSSProperties}>
              {content.projects[id].name}
            </a>
          ))}
        </nav>
        <form method="dialog">
          <button className="btn">
            {a.close} <kbd>esc</kbd>
          </button>
        </form>
      </header>
      {target && (
        <InAll.Provider value>
          <div className="work">
            <p className="all__count">{a.count(ids.length)}</p>
            {ids.map((id) => {
              const Stop = STOPS[id]
              if (id !== 'usher') return <Stop key={id} />
              return (
                <Fragment key={id}>
                  <header className="upcoming">
                    <h3>{content.upcoming.title}</h3>
                    <p>{content.upcoming.note}</p>
                  </header>
                  <Stop />
                </Fragment>
              )
            })}
          </div>
        </InAll.Provider>
      )}
    </dialog>
  )
}
