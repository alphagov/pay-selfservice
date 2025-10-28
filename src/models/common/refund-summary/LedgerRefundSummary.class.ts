import { RefundSummary } from './RefundSummary.class'
import { LedgerRefundSummaryData } from './dto/LedgerRefundSummary.dto'

class LedgerRefundSummary extends RefundSummary {
  readonly amountRefunded: number

  constructor(data: LedgerRefundSummaryData) {
    super(data)
    this.amountRefunded = data.amount_refunded
  }
}

export { LedgerRefundSummary }
