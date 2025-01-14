'use strict'

const requestLogger = require('./request-logger')
const { getRequestCorrelationIDField } = require('../../../services/clients/base/request-context')
const { CORRELATION_HEADER } = require('@root/config')

function transformRequestAddHeaders () {
  const correlationId = getRequestCorrelationIDField()
  const headers = {}
  if (correlationId) {
    headers[CORRELATION_HEADER] = correlationId
  }
  return headers
}

function onRequestStart (context) {
  requestLogger.logRequestStart(context)
}

function onSuccessResponse (context) {
  requestLogger.logRequestEnd(context)
}

function onFailureResponse (context) {
  requestLogger.logRequestEnd(context)
  requestLogger.logRequestFailure(context)
}

function configureClient (client, baseUrl) {
  client.configure(encodeURI(baseUrl), {
    transformRequestAddHeaders,
    onRequestStart,
    onSuccessResponse,
    onFailureResponse
  })
}

module.exports = {
  configureClient
}
