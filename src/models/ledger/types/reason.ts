export const Reason = {
  CREDIT_NOT_PROCESSED: 'CREDIT_NOT_PROCESSED',
  DUPLICATE: 'DUPLICATE',
  FRAUDULENT: 'FRAUDULENT',
  GENERAL: 'GENERAL',
  PRODUCT_NOT_RECEIVED: 'PRODUCT_NOT_RECEIVED',
  PRODUCT_UNACCEPTABLE: 'PRODUCT_UNACCEPTABLE',
  UNRECOGNISED: 'UNRECOGNISED',
  SUBSCRIPTION_CANCELLED: 'SUBSCRIPTION_CANCELLED',
  OTHER: 'OTHER',
  UNKNOWN: 'UNKNOWN',
} as const

export type Reason = (typeof Reason)[keyof typeof Reason]

const validReason = new Set(Object.values(Reason))

export const parseReason = (apiReason: string): Reason => {
  const parsed = apiReason.toUpperCase() as Reason
  return validReason.has(parsed) ? parsed : Reason.UNKNOWN
}

export const ReasonFriendlyNames: Record<Reason, string> = {
  CREDIT_NOT_PROCESSED: 'Credit not processed',
  DUPLICATE: 'Duplicate',
  FRAUDULENT: 'Fraudulent',
  GENERAL: 'General',
  PRODUCT_NOT_RECEIVED: 'Product not received',
  PRODUCT_UNACCEPTABLE: 'Product unacceptable',
  UNRECOGNISED: 'Unrecognised',
  SUBSCRIPTION_CANCELLED: 'Subscription cancelled',
  OTHER: 'Other',
  UNKNOWN: 'Unknown',
}
