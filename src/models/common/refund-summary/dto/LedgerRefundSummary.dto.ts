import { RefundSummaryData } from './RefundSummary.dto'

export interface LedgerRefundSummaryData extends RefundSummaryData {
  amount_refunded: number
}
