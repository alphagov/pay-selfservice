export type NonEmptyString = string & {
  __brand: 'non empty string'
}

export function nonEmpty(value: unknown): NonEmptyString | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  return value === '' ? undefined : (value as NonEmptyString)
}

export function nonEmptyStringArray(array: unknown[]): NonEmptyString[] {
  return array.map(nonEmpty).filter((maybeString) => maybeString !== undefined)
}
