import { ServiceRequest } from '@utils/types/express'
import {
  PaymentLinkCreationSession,
  CREATE_SESSION_KEY,
} from '@controllers/simplified-account/services/payment-links/create/constants'
import lodash from 'lodash'

export function isWelshSelected(req: ServiceRequest): boolean {
  const currentSession = lodash.get(req, CREATE_SESSION_KEY, {} as PaymentLinkCreationSession)
  return currentSession.language === 'cy' || (req.query.language as string) === 'cy'
}
