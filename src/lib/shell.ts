/**
 * The terminal's brain: a pure function from (line, shell) to (output, shell).
 * Two machines: the visitor's tab ("you@browser") and, after `ssh guest@shayan`, the portfolio as a home
 * directory. Nothing leaves the page; the "remote" is this file. The words here are part of the program,
 * so they live here and not in content.ts.
 */
import { content } from '../content'
import { bf, CHEEKY } from './bf'

export type Tone = 'ok' | 'fault' | 'dim'
export interface Line {
  text: string
  tone?: Tone
}
export interface Shell {
  remote: boolean
  cwd: string // '' is home
  asking: boolean // waiting for yes/no on the host key
}
export interface Visitor {
  city: string
  id: string
}
export type Effect = 'clear' | 'close' | 'mail' | { open: string }
export interface Result {
  shell: Shell
  out: Line[]
  effect?: Effect
}

export const START: Shell = { remote: false, cwd: '', asking: false }

type Id = keyof typeof content.projects
const ids = Object.keys(content.projects) as Id[]
const p = content.person

const LOCAL: Record<string, string> = {
  'README.txt': 'This is your side of the wire: a browser tab.\nThe files worth reading are on the other end.\n\n  ssh guest@shayan',
}
const REMOTE: Record<string, string> = {
  'about.txt': [`${p.name} · ${p.role}`, ...content.stops.edge.bio].join('\n'),
  'contact.txt': `${p.email}\n${p.github}\n${p.linkedin}\n\nOr just type: mail`,
  'secret.bf': CHEEKY,
  '.plan': 'Get the person reading this to write to me.',
  ...Object.fromEntries(
    ids.map((id) => {
      const x = content.projects[id]
      return [`projects/${id}.md`, `# ${x.name}\n${x.kind} · ${x.note}\n\n${x.vision}\n\nSee it run: open ${id}`]
    }),
  ),
}
const files = (s: Shell) => (s.remote ? REMOTE : LOCAL)

const resolve = (cwd: string, arg = ''): string => {
  const parts = /^[/~]/.test(arg) ? [] : cwd.split('/')
  for (const seg of arg.replace(/^~/, '').split('/')) {
    if (seg === '..') parts.pop()
    else if (seg && seg !== '.') parts.push(seg)
  }
  return parts.filter(Boolean).join('/')
}
const isDir = (s: Shell, path: string) => path === '' || Object.keys(files(s)).some((f) => f.startsWith(path + '/'))
/** Names directly inside `path`; directories end in "/". */
const list = (s: Shell, path: string, all = false): string[] => {
  const prefix = path ? path + '/' : ''
  const names = new Set<string>()
  for (const f of Object.keys(files(s))) {
    if (!f.startsWith(prefix)) continue
    const [first, ...rest] = f.slice(prefix.length).split('/')
    if (all || !first.startsWith('.')) names.add(rest.length ? first + '/' : first)
  }
  return [...names].sort()
}

export const prompt = (s: Shell): string =>
  s.asking ? 'Trust it anyway (yes/no)?' : s.remote ? `guest@shayan:~${s.cwd && '/' + s.cwd}$` : 'you@browser:~$'

const ok = (text: string): Line => ({ text, tone: 'ok' })
const bad = (text: string): Line => ({ text, tone: 'fault' })
const dim = (text: string): Line => ({ text, tone: 'dim' })
const plain = (text: string): Line[] => text.split('\n').map((t) => ({ text: t }))

const HELP_LOCAL = `You are on your own machine: a browser tab.

  ssh guest@shayan    connect to the portfolio (answer yes)
  ls, cat README.txt  look around this tab
  whoami              what the edge saw of you
  clear, exit         tidy up, or close the terminal

There is much more once you connect.`
const HELP_REMOTE = `Look around
  ls [-a] [dir]       list files (-a shows the hidden one)
  cat <file>          read one: about.txt, contact.txt, projects/kaput.md
  cd <dir>, pwd       move around

Do things
  open <project>      jump to it on the site (open all: every project)
  bf <file|program>   run Brainfuck. Try: bf secret.bf
  mail                write to Shayan
  whoami              who the edge thinks you are

Session
  clear, exit         also Ctrl+L and Ctrl+D
  Tab completes names. Up and Down recall what you typed.

For fun
  sudo, rm, vim, cheeky, echo, date, uname`
const ALIAS: Record<string, string> = { '--help': 'help', '-h': 'help', '?': 'help', man: 'help' }

/** Commands worth trying next, shown as buttons under the prompt. */
export const hints = (s: Shell): string[] =>
  s.asking ? ['yes', 'no'] : s.remote ? ['help', 'ls', 'cat about.txt', 'bf secret.bf', 'open all', 'mail', 'exit'] : ['help', 'ssh guest@shayan', 'whoami']

type Command = (args: string[], s: Shell, who: Visitor) => Line[] | Partial<Result>

const editor: Command = () => [dim('No editors here. You would never get out anyway.')]
const commands: Record<string, Command> = {
  help: (_a, s) => plain(s.remote ? HELP_REMOTE : HELP_LOCAL),
  ls: (args, s) => {
    const all = args.some((a) => /^-\w*a/.test(a))
    const path = resolve(s.cwd, args.find((a) => !a.startsWith('-')))
    if (path in files(s)) return plain(path.split('/').pop()!)
    if (!isDir(s, path)) return [bad(`ls: ${path}: no such file or directory`)]
    return plain(list(s, path, all).join('   '))
  },
  cat: (args, s) => {
    if (!args.length) return [bad('cat: which file?')]
    return args.flatMap((a) => {
      const path = resolve(s.cwd, a)
      if (isDir(s, path)) return [bad(`cat: ${a}: is a directory`)]
      return path in files(s) ? plain(files(s)[path]) : [bad(`cat: ${a}: no such file`)]
    })
  },
  cd: (args, s) => {
    const path = resolve(s.cwd, args[0] ?? '~')
    return isDir(s, path) ? { shell: { ...s, cwd: path } } : [bad(`cd: ${args[0]}: not a directory`)]
  },
  pwd: (_a, s) => plain(s.remote ? `/home/guest${s.cwd && '/' + s.cwd}` : '/tab'),
  whoami: (_a, s, who) => plain(s.remote ? `guest (really: request ${who.id}, from ${who.city})` : `you: request ${who.id}, from ${who.city}`),
  ssh: (args, s) => {
    if (s.remote) return [dim('You are already in.')]
    const host = (args.find((a) => !a.startsWith('-')) ?? '').split('@').pop()!
    if (!host) return plain('usage: ssh guest@shayan')
    if (!/^shayan/i.test(host)) return [bad(`ssh: could not resolve hostname ${host}: this terminal knows one host. Try: ssh guest@shayan`)]
    return {
      shell: { ...s, asking: true },
      out: plain("The authenticity of host 'shayan' can't be established.\nIt has no key, because it is a web page."),
    }
  },
  exit: (_a, s) => (s.remote ? { shell: START, out: plain('Connection to shayan closed.') } : { effect: 'close' }),
  clear: () => ({ effect: 'clear' }),
  mail: () => ({ effect: 'mail', out: [ok(`Opening a message to ${p.email}`)] }),
  open: (args, s) => {
    if (!s.remote) return [bad('open: nothing to open on this side. Try: ssh guest@shayan')]
    const id = (args[0] ?? '').replace(/^--/, '').replace(/\.md$/, '').split('/').pop()!.toLowerCase()
    const hit = id === 'all' ? 'all' : ids.find((x) => x === id || content.projects[x].name.toLowerCase() === id)
    return hit ? { effect: { open: hit }, out: [ok(`Opening ${hit}…`)] } : [bad(`open: which project? One of: ${ids.join(', ')}, all`)]
  },
  bf: (args, s) => {
    if (!args.length) return plain('usage: bf <file>   (or: bf <program>)')
    const path = resolve(s.cwd, args[0])
    try {
      return [ok(bf(path in files(s) ? files(s)[path] : args.join('')) || '(no output)')]
    } catch (e) {
      return [bad(`bf: ${(e as Error).message}`)]
    }
  },
  // unlisted
  cheeky: () => [ok(bf(CHEEKY))],
  sudo: () => [bad('guest is not in the sudoers file. This incident will be reported to nobody.')],
  rm: () => [dim('kaput caught that. Draining… 0 requests dropped, 0 files deleted. Nice try.')],
  echo: (args) => plain(args.join(' ')),
  date: () => plain(new Date().toString()),
  uname: () => plain('A browser tab, pretending.'),
  vim: editor,
  vi: editor,
  nano: editor,
  emacs: editor,
}

/** Run one line. Never throws. */
export function run(line: string, s: Shell, who: Visitor): Result {
  const input = line.trim()
  if (s.asking) {
    if (!/^y(es)?$/i.test(input)) return { shell: START, out: [bad('Host key verification failed.')] }
    return {
      shell: { remote: true, cwd: '', asking: false },
      out: [
        ok("Warning: permanently added 'shayan' to the list of hosts you trust on a hunch."),
        ...plain(`Connected to shayan · Karachi, UTC+5\nLast login: just now, from ${who.city} (request ${who.id})\n${ids.length} projects in ~/projects. help lists what works here.`),
      ],
    }
  }
  if (!input) return { shell: s, out: [] }
  const [first, ...args] = input.split(/\s+/)
  const name = ALIAS[first] ?? first
  const command = Object.hasOwn(commands, name) ? commands[name] : null
  if (!command) return { shell: s, out: [bad(`${name}: command not found. Type help (or --help) to see everything that works.`)] }
  const r = command(args, s, who)
  return Array.isArray(r) ? { shell: s, out: r } : { shell: s, out: [], ...r }
}

/** Tab: finish a command name, or a file name in the directory being typed. Returns the line unchanged if nothing (or too much) fits. */
export function complete(line: string, s: Shell): string {
  const at = line.lastIndexOf(' ') + 1
  const word = line.slice(at)
  let pool: string[]
  let stem = word
  if (at === 0) pool = Object.keys(commands)
  else {
    const slash = word.lastIndexOf('/') + 1
    stem = word.slice(slash)
    pool = list(s, resolve(s.cwd, word.slice(0, slash) || '.'), stem.startsWith('.'))
  }
  const hits = pool.filter((x) => x.startsWith(stem))
  return hits.length === 1 ? line.slice(0, line.length - stem.length) + hits[0] : line
}
