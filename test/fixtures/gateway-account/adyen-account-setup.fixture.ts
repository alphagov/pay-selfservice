import { AdyenAccountSetup, AdyenAccountSetupTaskStatus } from '@models/gateway-account/AdyenAccountSetup.class'
import { AdyenAccountSetupData, AdyenAccountSetupTaskData } from '@models/gateway-account/dto/AdyenAccountSetup.dto'

export class AdyenAccountSetupFixture {
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
    AdyenAccountSetupTaskFixture
  >

  constructor(...overrides: Partial<AdyenAccountSetupFixture>[]) {
    this.serviceExternalId = 'service-external-id-123-abc'
    this.credentialExternalId = 'gateway-account-credential-abc-123'
    this.tasks = {
      bankAccount: AdyenAccountSetupTaskFixture.NotStarted(),
      responsiblePerson: AdyenAccountSetupTaskFixture.NotStarted(),
      vatNumber: AdyenAccountSetupTaskFixture.NotStarted(),
      companyNumber: AdyenAccountSetupTaskFixture.NotStarted(),
      director: AdyenAccountSetupTaskFixture.NotStarted(),
      governmentEntityDocument: AdyenAccountSetupTaskFixture.NotStarted(),
      organisationDetails: AdyenAccountSetupTaskFixture.NotStarted(),
    }

    overrides.forEach((override) => {
      Object.assign(this, override)
    })
  }

  static NotStarted(...overrides: Partial<AdyenAccountSetupFixture>[]) {
    return new AdyenAccountSetupFixture(...overrides)
  }

  static Completed(...overrides: Partial<AdyenAccountSetupFixture>[]) {
    return new AdyenAccountSetupFixture(
      {
        tasks: {
          bankAccount: AdyenAccountSetupTaskFixture.Completed(),
          responsiblePerson: AdyenAccountSetupTaskFixture.Completed(),
          vatNumber: AdyenAccountSetupTaskFixture.Completed(),
          companyNumber: AdyenAccountSetupTaskFixture.Completed(),
          director: AdyenAccountSetupTaskFixture.Completed(),
          governmentEntityDocument: AdyenAccountSetupTaskFixture.Completed(),
          organisationDetails: AdyenAccountSetupTaskFixture.Completed(),
        },
      },
      ...overrides
    )
  }

  toAdyenAccountSetupData(): AdyenAccountSetupData {
    return {
      service_id: this.serviceExternalId,
      credential_external_id: this.credentialExternalId,
      tasks: {
        bank_account: this.tasks.bankAccount.toTaskData(),
        responsible_person: this.tasks.bankAccount.toTaskData(),
        vat_number: this.tasks.bankAccount.toTaskData(),
        company_number: this.tasks.bankAccount.toTaskData(),
        director: this.tasks.bankAccount.toTaskData(),
        government_entity_document: this.tasks.bankAccount.toTaskData(),
        organisation_details: this.tasks.bankAccount.toTaskData(),
      },
    }
  }

  toAdyenAccountSetup(): AdyenAccountSetup {
    return new AdyenAccountSetup(this.toAdyenAccountSetupData())
  }
}

export class AdyenAccountSetupTaskFixture {
  readonly status: AdyenAccountSetupTaskStatus

  constructor(...overrides: Partial<AdyenAccountSetupTaskFixture>[]) {
    this.status = AdyenAccountSetupTaskStatus.NOT_STARTED
    overrides.forEach((override) => {
      Object.assign(this, override)
    })
  }

  static NotStarted(...overrides: Partial<AdyenAccountSetupTaskFixture>[]) {
    return new AdyenAccountSetupTaskFixture(...overrides)
  }

  static Completed(...overrides: Partial<AdyenAccountSetupTaskFixture>[]) {
    return new AdyenAccountSetupTaskFixture({ status: AdyenAccountSetupTaskStatus.COMPLETED }, ...overrides)
  }

  toTaskData(): AdyenAccountSetupTaskData {
    return {
      status: this.status,
    }
  }
}
