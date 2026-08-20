import PaymentProviders from '@models/constants/payment-providers'

export type PaymentProvider = (typeof PaymentProviders)[keyof typeof PaymentProviders]
export const PaymentProvider = PaymentProviders
