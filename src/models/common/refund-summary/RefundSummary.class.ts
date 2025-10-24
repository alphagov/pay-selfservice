import { RefundSummaryData } from '@models/common/refund-summary/dto/RefundSummary.dto'

class RefundSummary {
  readonly status: string
  readonly userExternalId: string | null
  readonly amountAvailable: number
  readonly amountSubmitted: number

  constructor(data: RefundSummaryData) {
    this.status = data.status
    this.userExternalId = data.user_external_id
    this.amountAvailable = data.amount_available
    this.amountSubmitted = data.amount_submitted
  }
}

export { RefundSummary }
