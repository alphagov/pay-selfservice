'use strict'

const Ledger = require('../services/clients/ledger_client')
const getQueryStringForParams = require('../utils/get_query_string_for_params')

const searchLedger = async function searchLedger (accountId, filters) {
  try {
    const transactions = await Ledger.transactions(accountId, filters)
    return transactions
  } catch (error) {
    throw new Error('GET_FAILED')
  }
}

const csvSearchUrl = function csvSearchParams (filters, gatewayAccountId) {
  const queryParams = getQueryStringForParams(filters, true, true, true)
  const query = queryParams ? `&${queryParams}` : ''
  return `${process.env.LEDGER_URL}/v1/transaction?with_parent_transaction=true&account_id=${gatewayAccountId}${query}`
}

exports.search = searchLedger
exports.csvSearchUrl = csvSearchUrl
