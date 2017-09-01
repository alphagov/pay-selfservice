'use strict'

// NPM Dependencies
const q = require('q')
const logger = require('winston')

// Local Dependencies
const {ConnectorClient} = require('../services/clients/connector_client.js')

const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

/**
 * @param accountId
 * @param filters
 * @param correlationId
 * @returns {*}
 */
exports.search = (accountId, filters, correlationId) => {
  const defer = q.defer()
  const params = filters
  params.gatewayAccountId = accountId
  params.correlationId = correlationId

  connectorClient.searchTransactions(params, (data, response) => {
    if (response.statusCode !== 200) {
      defer.reject(new Error('GET_FAILED'))
    } else {
      defer.resolve(data)
    }
  }).on('connectorError', (err, connectorResponse) => {
    if (connectorResponse) return defer.reject(new Error('GET_FAILED'))
    clientUnavailable(err, defer, correlationId)
  })

  return defer.promise
}

/**
 * @param accountId
 * @param filters
 * @param correlationId
 * @returns {*}
 */
exports.searchAll = (accountId, filters, correlationId) => {
  const defer = q.defer()
  const params = filters
  params.gatewayAccountId = accountId
  params.correlationId = correlationId
  connectorClient.getAllTransactions(params, results => defer.resolve({results}))
    .on('connectorError', (err, connectorResponse) => {
      if (connectorResponse) return defer.reject(new Error('GET_FAILED'))
      clientUnavailable(err, defer, correlationId)
    })

  return defer.promise
}

function clientUnavailable (error, defer, correlationId) {
  logger.error(`[${correlationId}] Calling connector to search transactions for an account threw exception -`, {
    service: 'connector',
    method: 'GET',
    error: error
  })
  defer.reject(new Error('CLIENT_UNAVAILABLE'), error)
}
