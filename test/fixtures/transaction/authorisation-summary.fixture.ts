import { AuthorisationSummaryData } from '@models/common/authorisation-summary/dto/AuthorisationSummary.dto'

export class AuthorisationSummaryFixture {
  readonly threeDSecure: {
    required: boolean
  }

  constructor(options?: Partial<AuthorisationSummaryFixture>) {
    this.threeDSecure = {
      required: false,
    }

    if (options) {
      Object.assign(this, options)
    }
  }
  toAuthorisationSummaryData(): AuthorisationSummaryData {
    return {
      three_d_secure: this.threeDSecure,
    }
  }
}
