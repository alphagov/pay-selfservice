'use strict'

class StripeAccountSetup {
  constructor (opts) {
    this.bankAccount = opts.bank_account
    this.responsiblePerson = opts.responsible_person
    this.vatNumber = opts.vat_number
    this.companyNumber = opts.company_number
  }
}

module.exports = StripeAccountSetup
