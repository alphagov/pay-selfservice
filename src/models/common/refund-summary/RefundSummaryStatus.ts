// this is not a canonical list of possible refund summary statuses
// and may be incomplete
export const RefundSummaryStatus: Record<string, RefundSummaryStatus> = {
  UNAVAILABLE: 'unavailable',
  AVAILABLE: 'available',
  FULL: 'full',
  PENDING: 'pending',
  ERROR: 'error',
}

export type RefundSummaryStatus = 'available' | 'unavailable' | 'full' | 'pending' | 'error'
