import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { content } from '../content'
import { complete, hints, prompt, run, START, type Line, type Visitor } from '../lib/shell'

interface Entry extends Line {
  key: number
  i: number // position in its batch, for the stagger
  cmd?: boolean
}
const t = content.terminal
let nextKey = 0
const entries = (lines: Line[]): Entry[] => lines.map((l, i) => ({ ...l, key: nextKey++, i }))

/** A drop-down terminal. It really runs what you type (lib/shell.ts); `ssh guest@shayan` is the way in. */
export function Terminal({ open, who, mailHref, onClose, onOpen }: { open: boolean; who: Visitor; mailHref: string; onClose: () => void; onOpen: (id: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const scroll = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [shell, setShell] = useState(START)
  const [log, setLog] = useState<Entry[]>(() => entries(t.greeting.map((text) => ({ text, tone: 'dim' }))))
  const [value, setValue] = useState('')
  const past = useRef<string[]>([])
  const at = useRef(0)

  useEffect(() => {
    const d = dialog.current!
    if (open && !d.open) {
      d.showModal()
      input.current?.focus() // showModal would focus the close button
    }
    if (!open && d.open) d.close()
  }, [open])
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight
  }, [log])

  const submit = (line: string) => {
    const r = run(line, shell, who)
    if (line.trim()) at.current = past.current.push(line)
    setShell(r.shell)
    setValue('')
    setLog((l) => (r.effect === 'clear' ? [] : [...l, { text: `${prompt(shell)} ${line}`, key: nextKey++, i: 0, cmd: true }, ...entries(r.out)]))
    if (r.effect === 'close') dialog.current?.close()
    else if (r.effect === 'mail') location.href = mailHref
    else if (typeof r.effect === 'object') onOpen(r.effect.open)
  }

  const key = (e: KeyboardEvent<HTMLInputElement>) => {
    const h = past.current
    if (e.key === 'Enter') submit(value)
    else if (e.key === 'Tab') {
      e.preventDefault()
      setValue(complete(value, shell))
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      at.current = Math.min(h.length, Math.max(0, at.current + (e.key === 'ArrowUp' ? -1 : 1)))
      setValue(h[at.current] ?? '')
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault()
      setLog([])
    } else if (e.ctrlKey && e.key === 'c') {
      setLog((l) => [...l, { text: `${prompt(shell)} ${value}^C`, key: nextKey++, i: 0, cmd: true }])
      setShell((s) => ({ ...s, asking: false }))
      setValue('')
    } else if (e.ctrlKey && e.key === 'd') {
      e.preventDefault()
      submit('exit')
    }
  }

  return (
    <dialog className="term" ref={dialog} onClose={onClose} aria-label={t.title} onClick={() => input.current?.focus()}>
      <header className="term__bar">
        <span>{shell.remote ? 'guest@shayan — ssh' : 'you@browser'}</span>
        <form method="dialog">
          <button aria-label={t.close}>
            <kbd>esc</kbd>
          </button>
        </form>
      </header>
      <div className="term__scroll" ref={scroll}>
        <div role="log" aria-label={t.logLabel}>
          {log.map((l) => (
            <p key={l.key} className="term__line" data-tone={l.cmd ? 'cmd' : l.tone} style={{ '--i': l.i } as CSSProperties}>
              {l.text || ' '}
            </p>
          ))}
        </div>
        <label className="term__input">
          <span data-remote={shell.remote}>{prompt(shell)}</span>
          <input
            ref={input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={key}
            aria-label={t.inputLabel}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="send"
            placeholder={t.placeholder}
          />
        </label>
        <p className="term__hints">
          <span>{t.tryLabel}</span>
          {hints(shell).map((h) => (
            <button key={h} type="button" onClick={() => submit(h)}>
              {h}
            </button>
          ))}
        </p>
      </div>
    </dialog>
  )
}
