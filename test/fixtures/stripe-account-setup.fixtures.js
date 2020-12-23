'use strict'

function buildUpdateStripeAccountSetupFlagRequest (path, completed) {
  return [
    {
      op: 'replace',
      path,
      value: completed
    }
  ]
}

module.exports = {
  buildUpdateBankAccountDetailsFlagRequest (completed) {
    return buildUpdateStripeAccountSetupFlagRequest('bank_account', completed)
  },

  buildUpdateVatNumberFlagRequest (completed) {
    return buildUpdateStripeAccountSetupFlagRequest('vat_number', completed)
  },

  buildUpdateCompanyNumberFlagRequest (completed) {
    return buildUpdateStripeAccountSetupFlagRequest('company_number', completed)
  },

  buildUpdateResponsiblePersonFlagRequest (completed) {
    return buildUpdateStripeAccountSetupFlagRequest('responsible_person', completed)
  },

  buildGetStripeAccountSetupResponse (opts = {}) {
    return {
      'bank_account': opts.bank_account || false,
      'responsible_person': opts.responsible_person || false,
      'company_number': opts.company_number || false,
      'vat_number': opts.vat_number || false
    }
  }
}
