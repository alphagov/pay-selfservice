'use strict'

// NPM dependencies
const path = require('path')

// Global setup
const pactBase = require(path.join(__dirname, '/pact_base'))
const pactRegister = pactBase()

module.exports = {

  validTransactionSummaryResponse: () => {
    let data = {
      successful_payments: {count: 1, total_in_pence: 2},
      refunded_payments: {count: 3, total_in_pence: 4},
      net_income: {total_in_pence: 5}
    }

    return {
      getPactified: () => {
        return pactRegister.pactify(data)
      },
      getPlain: () => {
        return data
      }
    }
  },
  validTransactionsResponse: (opts = {}) => {
    let data = {
      total: opts.transactions.data.reduce((acc, cv) => acc + cv.amount, 0),
      count: opts.transactions.data.length,
      page: 1,
      results:
      [...opts.transactions.data],
      _links: opts.transactions.links
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
