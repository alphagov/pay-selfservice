import { AnyJson } from '@pact-foundation/pact/src/common/jsonTypes'

type AuthenticateRequest = AnyJson & {
  email: string
  password: string
}

export class AuthenticateRequestFixture {
  readonly email: string
  readonly password: string

  constructor(overrides?: Partial<AuthenticateRequestFixture>) {
    this.email = overrides?.email ?? 'homer.simpson@example.com'
    this.password = overrides?.password ?? 'donuts'
  }

  toRequest(): AuthenticateRequest {
    return {
      email: this.email,
      password: this.password,
    }
  }
}
