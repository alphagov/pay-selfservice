import { RefundSummaryStatus } from '@models/common/refund-summary/RefundSummaryStatus'

export interface RefundSummaryData {
  status: RefundSummaryStatus
  user_external_id: string | null
  amount_available: number
  amount_submitted: number
}
