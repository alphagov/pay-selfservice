'use strict'

const _ = require('lodash')
const utils = require('../cypress/utils/request_to_go_live_utils')
const { pactify } = require('./pact_base')

module.exports = {
  validPostGovUkPayAgreementRequest: opts => {
    opts = opts || {}

    const data = {
      user_external_id: opts.user_external_id || utils.variables.userExternalId
    }

    return {
      getPactified: () => {
        return pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  },

  validPostGovUkPayAgreementResponse: opts => {
    opts = opts || {}
    const data = {
      email: opts.email || 'someone@example.org',
      agreement_time: opts.agreementTime || '2019-02-13T11:11:16.878Z'
    }

    return {
      getPactified: () => {
        return pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  },

  validPostStripeAgreementRequest: opts => {
    opts = opts || {}

    const data = {
      ip_address: opts.ip_address || '93.184.216.34'
    }

    return {
      getPactified: () => {
        return pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  }
}
