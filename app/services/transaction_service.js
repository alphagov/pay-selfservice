'use strict'

const logger = require('../utils/logger')(__filename)
const { ConnectorClient } = require('../services/clients/connector_client.js')
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)
const Ledger = require('../services/clients/ledger_client')

const { FEATURE_USE_LEDGER_PAYMENTS } = process.env
const useLedgerTransactions = FEATURE_USE_LEDGER_PAYMENTS === 'true'

/**
 * @param accountId
 * @param filters
 * @param correlationId
 * @returns {*}
 */
const searchConnector = (accountId, filters, correlationId) => {
  return new Promise(function (resolve, reject) {
    const params = filters
    params.gatewayAccountId = accountId
    params.correlationId = correlationId

    connectorClient.searchTransactions(params, (data, response) => {
      if (response.statusCode !== 200) {
        reject(new Error('GET_FAILED'))
      } else {
        resolve(data)
      }
    }).on('connectorError', (err, connectorResponse) => {
      if (connectorResponse) return reject(new Error('GET_FAILED'))
      clientUnavailable(err, reject, correlationId)
    })
  })
}

const searchLedger = async function searchLedger (accountId, filters) {
  try {
    const transactions = await Ledger.transactions(accountId, filters)
    return transactions
  } catch (error) {
    throw new Error('GET_FAILED')
  }
}

const searchAllLedger = async function searchAllLedger (accountId, filters) {
  try {
    const transactions = await Ledger.allTransactionPages(accountId, filters)
    return transactions
  } catch (error) {
    throw new Error('GET_FAILED')
  }
}

/**
 * @param accountId
 * @param filters
 * @param correlationId
 * @returns {*}
 */
const searchAllConnector = (accountId, filters, correlationId) => {
  return new Promise(function (resolve, reject) {
    const params = filters
    params.gatewayAccountId = accountId
    params.correlationId = correlationId

    connectorClient.getAllTransactions(params, results => resolve({ results }))
      .on('connectorError', (err, connectorResponse) => {
        if (connectorResponse) return reject(new Error('GET_FAILED'))
        clientUnavailable(err, reject, correlationId)
      })
  })
}

function clientUnavailable (error, reject, correlationId) {
  logger.error(`[${correlationId}] Calling connector to search transactions for an account threw exception -`, {
    service: 'connector',
    method: 'GET',
    error: error
  })
  reject(new Error('CLIENT_UNAVAILABLE'), error)
}

exports.search = useLedgerTransactions ? searchLedger : searchConnector
exports.searchAll = useLedgerTransactions ? searchAllLedger : searchAllConnector
