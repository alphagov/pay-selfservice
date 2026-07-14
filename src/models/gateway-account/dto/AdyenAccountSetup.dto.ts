// TODO update when we know the Adyen KYC tasks
type AdyenAccountSetupTaskNames = never

export interface AdyenAccountSetupData {
  service_id: string
  credential_external_id: string
  tasks: Record<AdyenAccountSetupTaskNames, AdyenAccountSetupStatus>
}

type AdyenAccountSetupStatus = 'COMPLETED' | 'NOT_STARTED'
