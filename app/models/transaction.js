var q = require('q')
var _ = require('lodash')
var logger = require('winston')

var ConnectorClient = require('../services/clients/connector_client.js').ConnectorClient

module.exports = function (correlationId) {
  'use strict'

  correlationId = correlationId || ''

  var connectorClient = function () {
    return new ConnectorClient(process.env.CONNECTOR_URL)
  }

  var successfulSearch = function (data, response, defer) {
    var error = response.statusCode !== 200
    if (error) return defer.reject(new Error('GET_FAILED'))
    defer.resolve(data)
  }

  var clientUnavailable = function (error, defer, correlationId) {
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
  var search = function (accountID, filters) {
    var defer = q.defer()
    var params = filters
    params.gatewayAccountId = accountID
    params.correlationId = correlationId

    if (params.state && params.state.indexOf('-') !== -1) {
      params.transaction_type = _.split(params.state, '-')[0]
      params.state = _.split(params.state, '-')[1]
    }

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
  var searchAll = function (accountID, filters) {
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
