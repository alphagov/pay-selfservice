import { AnyJson } from '@pact-foundation/pact/src/common/jsonTypes'

type IncrementSessionVersionRequest = AnyJson & {
  op: string
  path: string
  value: number
}

export class IncrementSessionVersionFixture {
  readonly op: string
  readonly path: string
  readonly value: number

  constructor() {
    this.op = 'append'
    this.path = 'sessionVersion'
    this.value = 1
  }

  toRequest(): IncrementSessionVersionRequest {
    return {
      op: this.op,
      path: this.path,
      value: this.value,
    }
  }
}
