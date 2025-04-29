interface StripeAccountSetupData {
  bank_account: boolean
  responsible_person: boolean
  vat_number: boolean
  company_number: boolean
  director: boolean
  government_entity_document: boolean
  organisation_details: boolean
}

class StripeAccountSetup {
  readonly bankAccount: boolean
  readonly responsiblePerson: boolean
  readonly vatNumber: boolean
  readonly companyNumber: boolean
  readonly director: boolean
  readonly governmentEntityDocument: boolean
  readonly organisationDetails: boolean

  constructor(data: StripeAccountSetupData) {
    this.bankAccount = data.bank_account
    this.responsiblePerson = data.responsible_person
    this.vatNumber = data.vat_number
    this.companyNumber = data.company_number
    this.director = data.director
    this.governmentEntityDocument = data.government_entity_document
    this.organisationDetails = data.organisation_details
  }

  entityDocTaskAvailable() {
    const requiredTasks = Object.keys(this).filter((key) => key !== 'governmentEntityDocument')
    return requiredTasks.every((requiredTask) => this[requiredTask as keyof this] === true)
  }

  setupCompleted() {
    return Object.values(this).every((value) => value === true)
  }
}

export = StripeAccountSetup
