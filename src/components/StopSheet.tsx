import { createContext, useContext, type ReactNode } from 'react'
import { content } from '../content'
import { Strip } from './Strip'

/** True inside the "See all" screen, where a project may also be on the main page: ids get a prefix, and the vision is printed here. */
export const InAll = createContext(false)

interface Props {
  id: keyof typeof content.projects
  headline: string
  sentence: string
  /** One highlighted line of real code. */
  code: string
  /** Extra copy under the code line. */
  children?: ReactNode
  /** The working demo, on its paper sheet. */
  panel: ReactNode
  /** Pull-out detail. */
  details: ReactNode
}

/** One project: its name at full width, the claim on the left, the real thing running on the right. */
export function StopSheet({ id, headline, sentence, code, children, panel, details }: Props) {
  const project = content.projects[id]
  const all = useContext(InAll)
  const dom = all ? `all-${id}` : id
  return (
    <section className="project" id={dom} data-project={id} aria-labelledby={`${dom}-title`}>
      <header className="project__head">
        <h2 id={`${dom}-title`}>{project.name}</h2>
        <Strip id={id} />
        <p>
          <b>{project.kind}</b>
          <span>{project.note}</span>
        </p>
        {all && <p className="project__vision">{project.vision}</p>}
      </header>
      <div className="project__copy">
        <h3>{headline}</h3>
        <p>{sentence}</p>
        <pre className="code">
          <code>{code}</code>
        </pre>
        {children}
        <details>
          <summary>{content.stops.detailsLabel}</summary>
          <div className="details__body">{details}</div>
        </details>
      </div>
      <div className="project__panel">{panel}</div>
    </section>
  )
}
