type AdyenAccountSetupTaskNames =
  | 'bank_account'
  | 'responsible_person'
  | 'vat_number'
  | 'company_number'
  | 'director'
  | 'government_entity_document'
  | 'organisation_details'

export interface AdyenAccountSetupData {
  service_id: string
  credential_external_id: string
  tasks: Record<AdyenAccountSetupTaskNames, AdyenAccountSetupTaskData>
}

export interface AdyenAccountSetupTaskData {
  status: AdyenAccountSetupTaskStatus
}

type AdyenAccountSetupTaskStatus = 'COMPLETED' | 'NOT_STARTED'
