export const Status = {
  // used for payments only
  UNDEFINED: 'UNDEFINED',
  STARTED: 'STARTED',
  CAPTURABLE: 'CAPTURABLE',
  FAILED: 'FAILED',
  DECLINED: 'DECLINED',
  TIMEDOUT: 'TIMEDOUT',
  CANCELLED: 'CANCELLED',
  // used for payments and refunds
  CREATED: 'CREATED',
  SUBMITTED: 'SUBMITTED',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  // used for disputes only
  NEEDS_RESPONSE: 'NEEDS_RESPONSE',
  UNDER_REVIEW: 'UNDER_REVIEW',
  LOST: 'LOST',
  WON: 'WON',
} as const

export type Status = (typeof Status)[keyof typeof Status]

const validStatus = new Set(Object.values(Status))

export const parseStatus = (apiStatus: string): Status => {
  const parsed = apiStatus.toUpperCase() as Status
  return validStatus.has(parsed) ? parsed : Status.UNDEFINED
}

export const DisputeStatusFriendlyNames: Partial<Record<Status, string>> = {
  NEEDS_RESPONSE: 'Dispute awaiting evidence',
  UNDER_REVIEW: 'Dispute under review',
  LOST: 'Dispute lost to customer',
  WON: 'Dispute won in your favour',
}

export const RefundStatusFriendlyNames: Partial<Record<Status, string>> = {
  CREATED: 'Refund created',
  SUBMITTED: 'Refund submitted',
  SUCCESS: 'Refund successful',
  ERROR: 'Refund error',
}

export const PaymentStatusFriendlyNames: Partial<Record<Status, string>> = {
  CREATED: 'In progress',
  STARTED: 'In progress',
  CAPTURABLE: 'In progress',
  FAILED: 'Failed',
  TIMEDOUT: 'Timed out',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
  SUBMITTED: 'In progress',
  SUCCESS: 'Successful',
  ERROR: 'Error',
}
