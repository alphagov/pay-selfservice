'use strict'

// NPM Dependencies
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

/**
 * @param accountId
 * @param filters
 * @param correlationId
 * @returns {*}
 */
exports.searchAll = (accountId, filters, correlationId) => {
  return new Promise(function (resolve, reject) {
    const params = filters
    params.gatewayAccountId = accountId
    params.correlationId = correlationId

    connectorClient.getAllTransactions(params, results => resolve({results}))
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
