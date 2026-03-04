import { AnyJson } from '@pact-foundation/pact/src/common/jsonTypes'

type AuthenticateSecondFactorRequest = AnyJson & {
  code: string
}

export class AuthenticateSecondFactorFixture {
  readonly code: string

  constructor(options?: Partial<AuthenticateSecondFactorFixture>) {
    this.code = options?.code ?? '123456'
  }

  toRequest(): AuthenticateSecondFactorRequest {
    return {
      code: this.code,
    }
  }
}
