import { Matchers } from '@pact-foundation/pact'
import { AnyTemplate } from '@pact-foundation/pact/src/dsl/matchers'
const { somethingLike } = Matchers

type Pactified = AnyTemplate

const pactifyArray = (array: unknown[]): Pactified => {
  if (!(array instanceof Array)) {
    throw new Error('Attempting to pactify non-Array object as an array')
  }
  return array.map((v) => pactify(v))
}

const pactify = (object: unknown): Pactified => {
  if (object === null) {
    return null
  }

  if (typeof object === 'number') {
    return somethingLike(object)
  }

  if (object === undefined) {
    throw new Error('Attempting to pactify undefined value')
  }

  if (object.constructor !== Object) {
    return somethingLike<AnyTemplate>(object as AnyTemplate)
  }

  if (object instanceof Array) {
    return pactifyArray(object)
  }

  const pactified: Record<string, Pactified> = {}

  Object.keys(object).forEach((key: string) => {
    // @ts-expect-error clearly object[key] exists
    pactified[key] = pactify(object[key])
  })
  return pactified
}

export { pactify, pactifyArray }
