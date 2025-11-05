import { LedgerRefundSummaryData } from '@models/common/refund-summary/dto/LedgerRefundSummary.dto'

export class LedgerRefundSummaryFixture {
  readonly amountRefunded: number
  readonly status: string
  readonly userExternalId: string | null
  readonly amountAvailable: number
  readonly amountSubmitted: number

  constructor(options?: Partial<LedgerRefundSummaryFixture>) {
    this.amountRefunded = 0
    this.status = 'pending'
    this.userExternalId = null
    this.amountAvailable = 1000
    this.amountSubmitted = 0

    if (options) {
      Object.assign(this, options)
    }
  }

  toLedgerRefundSummaryData(): LedgerRefundSummaryData {
    return {
      amount_refunded: this.amountRefunded,
      status: this.status,
      user_external_id: this.userExternalId,
      amount_available: this.amountAvailable,
      amount_submitted: this.amountSubmitted,
    }
  }
}
