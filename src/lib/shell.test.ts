import { expect, test } from 'vitest'
import { complete, hints, prompt, run, START, type Shell } from './shell'

const who = { city: 'Lisbon', id: 'AB12' }
const text = (r: { out: { text: string }[] }) => r.out.map((l) => l.text).join('\n')
const login = (): Shell => run('yes', run('ssh guest@shayan', START, who).shell, who).shell

test('ssh asks about the host key, then connects with the visitor in the banner', () => {
  const asked = run('ssh guest@shayan', START, who)
  expect(asked.shell.asking).toBe(true)
  expect(run('no', asked.shell, who).shell).toEqual(START)
  const inside = run('yes', asked.shell, who)
  expect(inside.shell.remote).toBe(true)
  expect(text(inside)).toContain('from Lisbon (request AB12)')
  expect(prompt(inside.shell)).toBe('guest@shayan:~$')
  expect(text(run('ssh other.host', START, who))).toContain('could not resolve')
})

test('files: ls, cd, cat, and the secret', () => {
  let s = login()
  expect(text(run('ls', s, who))).toBe('about.txt   contact.txt   projects/   secret.bf')
  expect(text(run('ls -a', s, who))).toContain('.plan')
  s = run('cd projects', s, who).shell
  expect(prompt(s)).toBe('guest@shayan:~/projects$')
  expect(text(run('cat hitlimit.md', s, who))).toContain('# hitlimit')
  expect(text(run('bf ../secret.bf', s, who))).toBe('you cheeky bastard')
  expect(run('cd nowhere', s, who).out[0].tone).toBe('fault')
  expect(text(run('cat README.txt', START, who))).toContain('ssh guest@shayan')
})

test('effects, unknown commands and prototype names', () => {
  const s = login()
  expect(run('open bunWay', s, who).effect).toEqual({ open: 'bunway' })
  expect(run('open --all', s, who).effect).toEqual({ open: 'all' })
  expect(run('exit', s, who).shell).toEqual(START)
  expect(run('exit', START, who).effect).toBe('close')
  expect(text(run('constructor', s, who))).toContain('command not found')
  expect(run('   ', s, who).out).toEqual([])
})

test('tab completion', () => {
  const s = login()
  expect(complete('whoa', s)).toBe('whoami')
  expect(complete('cat se', s)).toBe('cat secret.bf')
  expect(complete('cat projects/hit', s)).toBe('cat projects/hitlimit.md')
  expect(complete('c', s)).toBe('c')
})

test('help in every spelling, and hints that follow the session', () => {
  const s = login()
  for (const h of ['help', '--help', '-h', '?']) expect(text(run(h, s, who))).toContain('bf <file|program>')
  expect(text(run('--help', START, who))).toContain('ssh guest@shayan')
  expect(hints(START)).toContain('ssh guest@shayan')
  expect(hints(run('ssh guest@shayan', START, who).shell)).toEqual(['yes', 'no'])
  for (const h of hints(s)) expect(run(h, s, who).out.every((l) => l.tone !== 'fault')).toBe(true)
})
