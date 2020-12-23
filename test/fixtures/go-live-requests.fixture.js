'use strict'

const utils = require('../cypress/utils/request-to-go-live-utils')

module.exports = {
  validPostGovUkPayAgreementRequest: (opts = {}) => {
    return {
      user_external_id: opts.user_external_id || utils.variables.userExternalId
    }
  },

  validPostGovUkPayAgreementResponse: (opts = {}) => {
    return {
      email: opts.email || 'someone@example.org',
      agreement_time: opts.agreementTime || '2019-02-13T11:11:16.878Z'
    }
  },

  validPostStripeAgreementRequest: (opts = {}) => {
    return {
      ip_address: opts.ip_address || '93.184.216.34'
    }
  }
}
