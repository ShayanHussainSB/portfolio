import { expect, test } from 'vitest'
import { bf, CHEEKY, HIRE } from './bf'

test('the secret says what it should', () => {
  expect(bf(CHEEKY)).toBe('you cheeky bastard')
  expect(bf(HIRE)).toBe('hire shayan. you scrolled this far.')
})

test('loops, wrapping and bad programs', () => {
  expect(bf('++++++++[>++++++++<-]>+.')).toBe('A')
  expect(bf('-.')).toBe('\xff')
  expect(() => bf('[')).toThrow('unmatched [')
  expect(() => bf(']')).toThrow('unmatched ]')
  expect(() => bf('+[]')).toThrow('gave up')
})
