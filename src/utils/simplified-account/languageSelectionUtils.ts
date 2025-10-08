import { ServiceRequest } from '@utils/types/express'
import {
  PaymentLinkCreationSession,
  CREATE_SESSION_KEY,
} from '@controllers/simplified-account/services/payment-links/create/constants'
import lodash from 'lodash'

export function getCurrentSession(req: ServiceRequest): PaymentLinkCreationSession {
  return lodash.get(req, CREATE_SESSION_KEY, {} as PaymentLinkCreationSession)
}

export function isWelshLanguage(req: ServiceRequest, currentSession: PaymentLinkCreationSession): boolean {
  return currentSession.language === 'cy' || (req.query.language as string) === 'cy'
}

export function isUsingEnglishServiceName(req: ServiceRequest, currentSession: PaymentLinkCreationSession): boolean {
  return currentSession.useEnglishServiceName ?? (req.query.useEnglishServiceName as string) === 'true'
}

export function isWelshSelected(req: ServiceRequest): boolean {
  const currentSession = getCurrentSession(req)
  return isWelshLanguage(req, currentSession)
}
