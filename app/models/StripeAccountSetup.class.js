'use strict'

class StripeAccountSetup {
  constructor (opts) {
    this.bankAccount = opts.bank_account
    this.vatNumberCompanyNumber = opts.vat_number_company_number
    this.responsiblePerson = opts.responsible_person
    this.vatNumber = opts.vat_number
    this.companyNumber = opts.company_number
  }
}

module.exports = StripeAccountSetup
