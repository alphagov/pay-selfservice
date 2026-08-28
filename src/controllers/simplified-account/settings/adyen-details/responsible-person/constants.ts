import { ServiceRequest } from '@utils/types/express'
import lodash from 'lodash'

const CREATE_SESSION_KEY = 'session.pageData.responsiblePerson'

export class ResponsiblePersonSession {
  firstName?: string
  lastName?: string
  dobDay?: string
  dobMonth?: string
  dobYear?: string
  addressLine1?: string
  addressLine2?: string
  addressCity?: string
  addressPostcode?: string
  telephoneNumber?: string
  email?: string

  constructor(data: ResponsiblePersonSession) {
    Object.assign(this, data)
  }

  static extract(req: ServiceRequest<unknown>) {
    return new ResponsiblePersonSession(lodash.get(req, CREATE_SESSION_KEY, {} as ResponsiblePersonSession))
  }

  static set(req: ServiceRequest<unknown>, ...sessionData: ResponsiblePersonSession[]) {
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
