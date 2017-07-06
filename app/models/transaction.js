const q = require('q')
const logger = require('winston')

const ConnectorClient = require('../services/clients/connector_client.js').ConnectorClient

module.exports = function (correlationId) {
  'use strict'

  correlationId = correlationId || ''

  const connectorClient = function () {
    return new ConnectorClient(process.env.CONNECTOR_URL)
  }

  const successfulSearch = function (data, response, defer) {
    var error = response.statusCode !== 200
    if (error) return defer.reject(new Error('GET_FAILED'))
    defer.resolve(data)
  }

  const clientUnavailable = function (error, defer, correlationId) {
    logger.error(`[${correlationId}] Calling connector to search transactions for an account threw exception -`, {
      service: 'connector',
      method: 'GET',
      error: error
    })
    defer.reject(new Error('CLIENT_UNAVAILABLE'), error)
  }

  /**
   *
   * @param accountID
   * @param filters
   * @returns {*}
   */
  const search = function (accountID, filters) {
    var defer = q.defer()
    var params = filters
    params.gatewayAccountId = accountID
    params.correlationId = correlationId

    connectorClient().searchTransactions(params, function (data, response) {
      successfulSearch(data, response, defer)
    }).on('connectorError', function (err, connectorResponse) {
      if (connectorResponse) return defer.reject(new Error('GET_FAILED'))
      clientUnavailable(err, defer, correlationId)
    })

    return defer.promise
  }

  /**
   *
   * @param accountID
   * @param filters
   * @returns {*}
   */
  const searchAll = function (accountID, filters) {
    var defer = q.defer()
    var params = filters
    params.gatewayAccountId = accountID
    params.correlationId = correlationId
    var success = function (results) { defer.resolve({results: results}) }

    connectorClient().getAllTransactions(params, success)
      .on('connectorError', function (err, connectorResponse) {
        if (connectorResponse) return defer.reject(new Error('GET_FAILED'))
        clientUnavailable(err, defer, correlationId)
      })

    return defer.promise
  }

  return {
    search: search,
    searchAll: searchAll
  }
}
