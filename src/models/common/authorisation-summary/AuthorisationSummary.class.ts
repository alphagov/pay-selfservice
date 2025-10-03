import { AuthorisationSummaryData } from '@models/common/authorisation-summary/dto/AuthorisationSummary.dto'

class AuthorisationSummary {
  readonly threeDSecure: {
    required: boolean
  }

  constructor(data: AuthorisationSummaryData) {
    this.threeDSecure = data.three_d_secure
  }
}

export { AuthorisationSummary }
