export interface RefundSummaryData {
  status: string
  user_external_id: string | null
  amount_available: number
  amount_submitted: number
  amount_refunded: number
}
