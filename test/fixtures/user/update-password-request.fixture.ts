import { AnyJson } from '@pact-foundation/pact/src/common/jsonTypes'

type UpdatePasswordRequest = AnyJson & {
  forgotten_password_code: string
  new_password: string
}

export class UpdatePasswordFixture {
  readonly forgottenPasswordCode: string
  readonly newPassword: string

  constructor(options?: Partial<UpdatePasswordFixture>) {
    this.forgottenPasswordCode = options?.forgottenPasswordCode ?? '5ylaem'
    this.newPassword = options?.newPassword ?? 'G0VUkPay2017Rocks'
  }

  toRequest(): UpdatePasswordRequest {
    return {
      forgotten_password_code: this.forgottenPasswordCode,
      new_password: this.newPassword,
    }
  }
}
