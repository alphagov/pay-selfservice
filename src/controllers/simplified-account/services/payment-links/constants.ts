export interface PaymentLinkCreationSession {
  pageData?: {
    createPaymentLink?: {
      paymentLinkTitle?: string
      paymentLinkDescription?: string
      serviceNamePath?: string
      productNamePath?: string
      isWelsh?: boolean
      payApiToken?: string
      gatewayAccountId?: number
      paymentLinkAmount?: number
      paymentReferenceType?: string
      paymentReferenceLabel?: string
      paymentReferenceHint?: string
    }
  }
}

export const supportedLanguage = {
  ENGLISH: 'en',
  WELSH: 'cy',
} as const

export type SupportedLanguage = typeof supportedLanguage[keyof typeof supportedLanguage]
