import { AdyenAccountSetupData } from '@models/gateway-account/dto/AdyenAccountSetup.dto'

export class AdyenAccountSetup {
  readonly serviceExternalId: string
  readonly credentialExternalId: string
  readonly tasks: Record<AdyenAccountSetupTask, AdyenAccountSetupTaskStatus>

  constructor(data: AdyenAccountSetupData) {
    this.serviceExternalId = data.service_id
    this.credentialExternalId = data.credential_external_id
    this.tasks = data.tasks
  }
}

export type AdyenAccountSetupTask = string

export const AdyenAccountSetupTaskStatus = {
  COMPLETED: 'COMPLETED',
  NOT_STARTED: 'NOT_STARTED',
} as const

export type AdyenAccountSetupTaskStatus = 'COMPLETED' | 'NOT_STARTED'
