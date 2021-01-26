'use strict'

const ledgerFixture = require('../../fixtures/ledger-transaction.fixtures')
const { stubBuilder } = require('./stub-builder')

function getDashboardStatistics (opts = {}) {
  const path = '/v1/report/transactions-summary'
  return stubBuilder('GET', path, 200, {
    response: ledgerFixture.validTransactionSummaryDetails(opts)
  })
}

function getDashboardStatisticsWithFromDate(fromDate, opts = {}) {
  const path = '/v1/report/transactions-summary'
  return stubBuilder('GET', path, 200, {
    query: {
      from_date: fromDate
    },
    response: ledgerFixture.validTransactionSummaryDetails(opts),
    deepMatchRequest: false
  })
}

module.exports = {
  getDashboardStatistics,
  getDashboardStatisticsWithFromDate
}
