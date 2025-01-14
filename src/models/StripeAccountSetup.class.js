'use strict'

class StripeAccountSetup {
  constructor (opts) {
    this.bankAccount = opts.bank_account
    this.responsiblePerson = opts.responsible_person
    this.vatNumber = opts.vat_number
    this.companyNumber = opts.company_number
    this.director = opts.director
    this.governmentEntityDocument = opts.government_entity_document
    this.organisationDetails = opts.organisation_details
  }
}

module.exports = StripeAccountSetup
