import { ServiceRequest } from '@utils/types/express'
import lodash from 'lodash'

const CREATE_SESSION_KEY = 'session.pageData.AdyenStatementDescriptors'

export interface AdyenStatementDescriptorsData {
  userDescriptor: string
  payoutDescriptor: string
}

export type UserDescriptorBody = Pick<AdyenStatementDescriptorsData, 'userDescriptor'>
export type PayoutDescriptorBody = Pick<AdyenStatementDescriptorsData, 'payoutDescriptor'>

export class AdyenStatementDescriptorsSession {
  userDescriptor?: string
  payoutDescriptor?: string

  constructor(data: Partial<AdyenStatementDescriptorsData>) {
    Object.assign(this, data)
  }

  static extract(req: ServiceRequest<unknown>) {
    return new AdyenStatementDescriptorsSession(
      lodash.get(req, CREATE_SESSION_KEY, {} as Partial<AdyenStatementDescriptorsData>)
    )
  }

  static set(req: ServiceRequest<unknown>, ...sessionData: Partial<AdyenStatementDescriptorsData>[]) {
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
