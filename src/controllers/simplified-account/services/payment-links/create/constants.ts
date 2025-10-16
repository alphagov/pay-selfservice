import { ServiceRequest } from '@utils/types/express'
import lodash from 'lodash'
import { SlugifiedString } from '@utils/simplified-account/format/slugify-string'

const CREATE_SESSION_KEY = 'session.pageData.createPaymentLink'

export class PaymentLinkCreationSession {
  paymentLinkTitle?: string
  paymentLinkDescription?: string
  serviceNamePath?: SlugifiedString
  productNamePath?: SlugifiedString
  language?: 'en' | 'cy'
  useEnglishServiceName?: boolean
  payApiToken?: string
  gatewayAccountId?: number
  paymentLinkAmount?: number
  paymentAmountType?: 'fixed' | 'variable'
  paymentAmountHint?: string
  paymentReferenceType?: 'custom' | 'standard'
  paymentReferenceLabel?: string
  paymentReferenceHint?: string
  metadata?: Record<string, string>

  constructor(data: PaymentLinkCreationSession) {
    Object.assign(this, data)
  }

  static extract(req: ServiceRequest<unknown>) {
    return new PaymentLinkCreationSession(lodash.get(req, CREATE_SESSION_KEY, {} as PaymentLinkCreationSession))
  }

  static set(req: ServiceRequest<unknown>, ...sessionData: PaymentLinkCreationSession[]) {
    lodash.set(req, CREATE_SESSION_KEY, Object.assign({}, ...sessionData))
  }

  static clear(req: ServiceRequest<unknown>) {
    return lodash.unset(req, CREATE_SESSION_KEY)
  }

  isEmpty() {
    return lodash.isEmpty(lodash.omitBy(this, (v) => lodash.isUndefined(v)))
  }
}

export const FROM_REVIEW_QUERY_PARAM = 'fromReview'
