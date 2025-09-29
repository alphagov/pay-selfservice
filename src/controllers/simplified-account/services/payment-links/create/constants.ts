import { ServiceRequest } from '@utils/types/express'
import lodash from 'lodash'

export interface PaymentLinkCreationSession {
  paymentLinkTitle: string
  paymentLinkDescription?: string
  serviceNamePath: string
  productNamePath: string
  language: 'en' | 'cy'
  useEnglishServiceName?: boolean
  payApiToken: string
  gatewayAccountId: number
  paymentLinkAmount: number
  paymentAmountType: 'fixed' | 'variable'
  paymentAmountHint?: string
  paymentReferenceType: 'custom' | 'standard'
  paymentReferenceLabel: string
  paymentReferenceHint?: string
  metadata?: Record<string, string>
}

export const CREATE_SESSION_KEY = 'session.pageData.createPaymentLink'
export const FROM_REVIEW_QUERY_PARAM = 'fromReview'

export function getSession<T>(
  req: ServiceRequest<T>,
  defaultValue: PaymentLinkCreationSession
): PaymentLinkCreationSession
export function getSession<T>(req: ServiceRequest<T>): PaymentLinkCreationSession

export function getSession<T>(
  req: ServiceRequest<T>,
  defaultValue?: PaymentLinkCreationSession
): PaymentLinkCreationSession {
  return lodash.get(req, CREATE_SESSION_KEY, defaultValue ?? ({} as PaymentLinkCreationSession))
}
