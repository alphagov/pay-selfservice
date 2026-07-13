export interface AdyenAccountSetupData {
  service_id: string
  credential_external_id: string
  tasks: Record<string, AdyenAccountSetupStatus>
}

export type AdyenAccountSetupStatus = 'COMPLETED' | 'NOT_STARTED'
