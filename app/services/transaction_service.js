'use strict'

const qs = require('qs')

const Ledger = require('../services/clients/ledger_client')
const getQueryStringForParams = require('../utils/get_query_string_for_params')

const searchLedger = async function searchLedger (gatewayAccountIds = [], filters) {
  try {
    const transactions = await Ledger.transactions(gatewayAccountIds, filters)
    return transactions
  } catch (error) {
    throw new Error('GET_FAILED')
  }
}

const csvSearchUrl = function csvSearchParams (filters, gatewayAccountIds = []) {
  const formatOptions = { arrayFormat: 'comma' }
  const params = {
    account_id: gatewayAccountIds,
    with_parent_transaction: true
  }

  const formattedParams = qs.stringify(params, formatOptions)
  const formattedFilterParams = getQueryStringForParams(filters, true, true, true)
  return `${process.env.LEDGER_URL}/v1/transaction?${formattedParams}&${formattedFilterParams}`
}

exports.search = searchLedger
exports.csvSearchUrl = csvSearchUrl
