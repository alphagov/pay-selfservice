'use strict'

const ledgerFixture = require('../../fixtures/ledger-transaction.fixtures')
const { stubBuilder } = require('./stub-builder')

function getDashboardStatistics (opts) {
  const path = '/v1/report/transactions-summary'
  return stubBuilder('GET', path, 200, {
    response: ledgerFixture.validTransactionSummaryDetails(opts)
  })
}

module.exports = {
  getDashboardStatistics
}
