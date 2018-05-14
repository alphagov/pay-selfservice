'use strict'

// NPM dependencies
const path = require('path')

// Global setup
const pactBase = require(path.join(__dirname, '/pact_base'))
const pactRegister = pactBase()

module.exports = {

  validTransactionSummaryResponse: (opts = {}) => {
    let data = {
      successful_payments: {count: 0, total_in_pence: 0},
      refunded_payments: {count: 0, total_in_pence: 0},
      net_income: {total_in_pence: 0}
    }

    return {
      getPactified: () => {
        return pactRegister.pactify(data)
      },
      getPlain: () => {
        return data
      }
    }
  }

}
