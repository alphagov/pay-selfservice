export const ResourceType = {
  PAYMENT: 'PAYMENT',
  REFUND: 'REFUND',
  DISPUTE: 'DISPUTE',
} as const

export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType]
