import { AdyenAccountSetupTask, AdyenAccountSetupTaskStatus } from '@models/gateway-account/AdyenAccountSetup.class'

export class AdyenAccountSetupFixture {
  readonly serviceExternalId: string
  readonly credentialExternalId: string
  readonly tasks: Record<AdyenAccountSetupTask, AdyenAccountSetupTaskStatus>

  constructor(...overrides: AdyenAccountSetupFixture[]) {
    this.serviceExternalId = 'service-external-id-123-abc'
    this.credentialExternalId = 'gateway-account-credential-abc-123'
    this.tasks = {
      unknown_task: 'NOT_STARTED',
    }

    overrides.forEach((override) => {
      Object.assign(this, override)
    })
  }
}
