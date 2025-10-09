import { a } from './a'

export const b: { a: unknown; b: number } = {
  a: () => a.a,
  b: 2,
}

// export const bVal = 2
