'use strict'

// NPM dependencies
const path = require('path')
const _ = require('lodash')

// Global setup
const pactBase = require(path.join(__dirname, '/pact_base'))
const pactRegister = pactBase()

function buildUpdateStripeAccountSetupFlagRequest (path, completed) {
  const data = [
    {
      op: 'replace',
      path,
      value: completed
    }
  ]

  return {
    getPactified: () => {
      return pactRegister.pactify(data)
    },
    getPlain: () => {
      return _.clone(data)
    }
  }
}

module.exports = {
  buildUpdateBankAccountDetailsFlagRequest (completed) {
    return buildUpdateStripeAccountSetupFlagRequest('bank_account', completed)
  },

  buildUpdateVatNumberCompanyNumberFlagRequest (completed) {
    return buildUpdateStripeAccountSetupFlagRequest('vat_number_company_number', completed)
  },

  buildUpdateResponsiblePersonFlagRequest (completed) {
    return buildUpdateStripeAccountSetupFlagRequest('responsible_person', completed)
  },

  buildGetStripeAccountSetupResponse (opts = {}) {
    const data = {
      'bank_account': opts.bank_account || false,
      'responsible_person': opts.responsible_person || false,
      'company_number': opts.company_number || false,
      'vat_number': opts.vat_number || false
    }

    return {
      getPactified: () => {
        return pactRegister.pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  },

  buildGetStripeAccountResponse (opts = {}) {
    const data = {
      'stripe_account_id': opts.stripe_account_id || 'acct_123example123'
    }

    return {
      getPactified: () => {
        return pactRegister.pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  }
}
