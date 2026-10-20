import { ServiceRequest } from '@utils/types/express'
import lodash from 'lodash'

const CREATE_SESSION_KEY = 'session.pageData.organisationDetails'

export interface CompanyRegistrationBody {
  companyRegistrationNumber: string
}

export interface VatRegistrationBody {
  vatRegistrationNumber: string
}

export interface OrganisationDetailsBody {
  organisationName: string
  addressLine1: string
  addressLine2: string
  addressCity: string
  addressPostcode: string
  addressCountry: string
  hasCompanyRegistrationNumber: string
}

export class OrganisationDetailsSession {
  organisationName?: string
  addressLine1?: string
  addressLine2?: string
  addressCity?: string
  addressPostcode?: string
  addressCountry?: string
  hasCompanyRegistrationNumber?: string
  companyRegistrationNumber?: string
  vatRegistrationNumber?: string

  constructor(data: OrganisationDetailsSession) {
    Object.assign(this, data)
  }

  static extract(req: ServiceRequest<unknown>) {
    return new OrganisationDetailsSession(lodash.get(req, CREATE_SESSION_KEY, {} as OrganisationDetailsSession))
  }

  static set(req: ServiceRequest<unknown>, ...sessionData: OrganisationDetailsSession[]) {
    lodash.set(req, CREATE_SESSION_KEY, Object.assign({}, ...sessionData))
  }

  static clear(req: ServiceRequest<unknown>) {
    return lodash.unset(req, CREATE_SESSION_KEY)
  }

  isEmpty() {
    return lodash.isEmpty(lodash.omitBy(this, (v) => lodash.isUndefined(v)))
  }
}

export type TakingPaymentsFor = 'government-activities' | 'police-safety' | 'everything-else'

export const INDUSTRY_CODE_MAP: Record<TakingPaymentsFor, string> = {
  'government-activities': '921',
  'police-safety': '92219',
  'everything-else': '92B',
}
