import { b } from './b'

export const a: { a: number; b: unknown } = {
  a: 1,
  b: () => b.b,
}
// export const aVal = 1
