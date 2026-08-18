const PaymentProviders = {
  STRIPE: 'stripe',
  WORLDPAY: 'worldpay',
  SANDBOX: 'sandbox',
  ADYEN: 'adyen',
} as const

export = PaymentProviders
