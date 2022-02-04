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

  buildUpdateDirectorRequest (completed) {
    return buildUpdateStripeAccountSetupFlagRequest('director', completed)
  },

  buildGovernmentEntityDocumentRequest (completed) {
    return buildUpdateStripeAccountSetupFlagRequest('government_entity_document', completed)
  },

  buildUpdateAdditionalKycDataRequest (completed) {
    return buildUpdateStripeAccountSetupFlagRequest('additional_kyc_data', completed)
  },

  buildGetStripeAccountSetupResponse (opts = {}) {
    return {
      bank_account: opts.bank_account || false,
      responsible_person: opts.responsible_person || false,
      company_number: opts.company_number || false,
      government_entity_document: opts.government_entity_document || false,
      vat_number: opts.vat_number || false,
      director: opts.director || false,
      additional_kyc_data: opts.additional_kyc_data || false
    }
  }
}
