import { AdyenAccountSetupData } from '@models/gateway-account/dto/AdyenAccountSetup.dto'

export class AdyenAccountSetup {
  readonly serviceExternalId: string
  readonly credentialExternalId: string
  readonly tasks: Record<
    | 'bankAccount'
    | 'responsiblePerson'
    | 'vatNumber'
    | 'companyNumber'
    | 'director'
    | 'governmentEntityDocument'
    | 'organisationDetails',
    AdyenAccountSetupTask
  >

  constructor(data: AdyenAccountSetupData) {
    this.serviceExternalId = data.service_id
    this.credentialExternalId = data.credential_external_id
    this.tasks = {
      bankAccount: data.tasks.bank_account,
      responsiblePerson: data.tasks.responsible_person,
      vatNumber: data.tasks.vat_number,
      companyNumber: data.tasks.company_number,
      director: data.tasks.director,
      governmentEntityDocument: data.tasks.government_entity_document,
      organisationDetails: data.tasks.organisation_details,
    }
  }
}

export interface AdyenAccountSetupTask {
  status: AdyenAccountSetupTaskStatus
}

export const AdyenAccountSetupTaskStatus = {
  COMPLETED: 'COMPLETED' as AdyenAccountSetupTaskStatus,
  NOT_STARTED: 'NOT_STARTED' as AdyenAccountSetupTaskStatus,
} as const

export type AdyenAccountSetupTaskStatus = 'COMPLETED' | 'NOT_STARTED'
