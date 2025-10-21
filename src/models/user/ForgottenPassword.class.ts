import { ForgottenPasswordData } from '@models/user/dto/ForgottenPassword.dto'

export class ForgottenPassword {
  readonly links: {
    href: string
    method: string
    rel: string
  }[]
  readonly code: string
  readonly date: string
  readonly userExternalId: string

  constructor(forgottenPasswordData: ForgottenPasswordData) {
    this.links = forgottenPasswordData._links
    this.code = forgottenPasswordData.code
    this.date = forgottenPasswordData.date
    this.userExternalId = forgottenPasswordData.user_external_id
  }
}
