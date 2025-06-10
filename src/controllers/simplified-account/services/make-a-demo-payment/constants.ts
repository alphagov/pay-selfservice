export interface DemoPaymentSessionData {
  description?: string
  amount?: number
}

export const PAYMENT_DEFAULTS = {
  description: 'An example payment description',
  amount: 2000
} as DemoPaymentSessionData

export const SESSION_KEY = 'session.pageData.demoPayment'
