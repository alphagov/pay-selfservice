'use strict'

class StripeAccountSetup {
  constructor (opts) {
    this.bankAccount = opts.bank_account
    this.organisationDetails = opts.organisation_details
    this.responsiblePerson = opts.responsible_person
  }
}

module.exports = StripeAccountSetup
