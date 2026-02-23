import { Status } from '@models/transaction/types/status'

interface StatusFilter {
  id: string
  friendly: string
  statuses: Status[]
}

const AllStatusFilter: StatusFilter[] = [
  {
    id: '',
    friendly: 'All',
    statuses: [],
  },
]

// Payment status "failed" is a legacy status not used for new payments
// see TransactionState.java in pay-ledger
const PaymentStatusFilters: StatusFilter[] = [
  {
    id: 'in_progress',
    friendly: 'In progress',
    statuses: [Status.CREATED, Status.STARTED, Status.CAPTURABLE, Status.SUBMITTED],
  },
  {
    id: 'success',
    friendly: 'Success',
    statuses: [Status.SUCCESS],
  },
  {
    id: 'declined',
    friendly: 'Declined',
    statuses: [Status.DECLINED],
  },
  {
    id: 'timed_out',
    friendly: 'Timed out',
    statuses: [Status.TIMEDOUT],
  },
  {
    id: 'cancelled',
    friendly: 'Cancelled',
    statuses: [Status.CANCELLED],
  },
  {
    id: 'error',
    friendly: 'Error',
    statuses: [Status.ERROR],
  },
]

const RefundStatusFilters: StatusFilter[] = [
  {
    id: 'refund_created',
    friendly: 'Refund created',
    statuses: [Status.CREATED],
  },
  {
    id: 'refund_submitted',
    friendly: 'Refund submitted',
    statuses: [Status.SUBMITTED],
  },
  {
    id: 'refund_success',
    friendly: 'Refund successful',
    statuses: [Status.SUCCESS],
  },
  {
    id: 'refund_error',
    friendly: 'Refund error',
    statuses: [Status.ERROR],
  },
]

const DisputeStatusFilters: StatusFilter[] = [
  {
    id: 'dispute_awaiting_evidence',
    friendly: 'Dispute awaiting evidence',
    statuses: [Status.NEEDS_RESPONSE],
  },
  {
    id: 'dispute_under_review',
    friendly: 'Dispute under review',
    statuses: [Status.UNDER_REVIEW],
  },
  {
    id: 'dispute_won',
    friendly: 'Dispute won in your favour',
    statuses: [Status.WON],
  },
  {
    id: 'dispute_lost',
    friendly: 'Dispute lost to customer',
    statuses: [Status.LOST],
  },
]

function statusFilterMapping(filters: StatusFilter[]): Map<string, Status[]> {
  const filterMap = new Map<string, Status[]>()

  filters.forEach((filter) => {
    filterMap.set(filter.id, filter.statuses)
  })

  return filterMap
}

export const PaymentStatusFilterMapping = statusFilterMapping(PaymentStatusFilters)
export const RefundStatusFilterMapping = statusFilterMapping(RefundStatusFilters)
export const DisputeStatusFilterMapping = statusFilterMapping(DisputeStatusFilters)

export const WorldpayStatusFilters = ([] as StatusFilter[]).concat(
  AllStatusFilter,
  PaymentStatusFilters,
  RefundStatusFilters
)
export const StripeStatusFilters = ([] as StatusFilter[]).concat(
  AllStatusFilter,
  PaymentStatusFilters,
  RefundStatusFilters,
  DisputeStatusFilters
)
