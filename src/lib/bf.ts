/** A Brainfuck interpreter: 30,000 wrapping byte cells, no input. Gives up after `max` steps so a typo can't hang the tab. */
export function bf(src: string, max = 1e6): string {
  const jump = new Map<number, number>()
  const open: number[] = []
  for (let i = 0; i < src.length; i++) {
    if (src[i] === '[') open.push(i)
    else if (src[i] === ']') {
      const j = open.pop()
      if (j === undefined) throw new Error('unmatched ]')
      jump.set(i, j).set(j, i)
    }
  }
  if (open.length) throw new Error('unmatched [')
  const tape = new Uint8Array(30000)
  let out = ''
  for (let i = 0, p = 0, steps = 0; i < src.length; i++) {
    if (++steps > max) throw new Error(`gave up after ${max} steps`)
    const c = src[i]
    if (c === '>') p = (p + 1) % tape.length
    else if (c === '<') p = (p + tape.length - 1) % tape.length
    else if (c === '+') tape[p]++
    else if (c === '-') tape[p]--
    else if (c === '.') out += String.fromCharCode(tape[p])
    else if (c === '[' && !tape[p]) i = jump.get(i)!
    else if (c === ']' && tape[p]) i = jump.get(i)!
  }
  return out
}

/** The secret. Run it to find out what it says (bf.test.ts knows). */
export const CHEEKY =
  '>+++++++++++[<+++++++++++>-]<.----------.++++++.>+++++++[<------------>-]<-.>++++++[<+++++++++++>-]<+.+++++.---..++++++.++++++++++++++.>++++++++[<----------->-]<-.>++++++[<+++++++++++>-]<.-.>+++[<++++++>-]<.+.>+++[<------>-]<-.>++++[<++++>-]<+.--------------.'

/** What the site says when asked to say it in Brainfuck (bf.test.ts knows). */
export const HIRE =
  '>++++++++[<+++++++++++++>-]<.+.+++++++++.-------------.>++++++[<----------->-]<---.>+++++++++[<+++++++++>-]<++.-----------.-------.>++++[<++++++>-]<.>++++[<------>-]<.+++++++++++++.>++++++++[<-------->-]<.--------------.>++++++++[<+++++++++++>-]<+.----------.++++++.>+++++++[<------------>-]<-.>+++++++++[<+++++++++>-]<++.>++++[<---->-]<.+++++++++++++++.---.---..-------.-.>++++++[<----------->-]<--.>+++++++[<++++++++++++>-]<.------------.+.++++++++++.>+++++++++[<--------->-]<--.>+++++++[<++++++++++>-]<.-----.>++++[<++++>-]<+.>++++++[<----------->-]<--.'
