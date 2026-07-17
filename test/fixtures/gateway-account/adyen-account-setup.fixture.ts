import {
  AdyenAccountSetup,
  AdyenAccountSetupTask,
  AdyenAccountSetupTaskStatus,
} from '@models/gateway-account/AdyenAccountSetup.class'
import { AdyenAccountSetupData } from '@models/gateway-account/dto/AdyenAccountSetup.dto'

export class AdyenAccountSetupFixture {
  readonly serviceExternalId: string
  readonly credentialExternalId: string
  readonly tasks: Record<AdyenAccountSetupTask, AdyenAccountSetupTaskStatus>

  constructor(...overrides: Partial<AdyenAccountSetupFixture>[]) {
    this.serviceExternalId = 'service-external-id-123-abc'
    this.credentialExternalId = 'gateway-account-credential-abc-123'
    this.tasks = {}

    overrides.forEach((override) => {
      Object.assign(this, override)
    })
  }

  toAdyenAccountSetupData(): AdyenAccountSetupData {
    return {
      service_id: this.serviceExternalId,
      credential_external_id: this.credentialExternalId,
      tasks: this.tasks,
    }
  }

  toAdyenAccountSetup(): AdyenAccountSetup {
    return new AdyenAccountSetup(this.toAdyenAccountSetupData())
  }
}
