'use strict'

const request = require('request')
const { getRequestCorrelationIDField } = require('../../../utils/request-context')
const joinURL = require('url-join')
const lodash = require('lodash')
const { CORRELATION_HEADER } = require('../../../utils/correlation-header')
const requestLogger = require('../../../utils/request-logger')
const { RESTClientError } = require('../../../errors')

// Constants
const SUCCESS_CODES = [200, 201, 202, 204, 206]

// Create request.defaults config
const requestOptions = {
  agentOptions: {
    keepAlive: true,
    maxSockets: process.env.MAX_SOCKETS || 100
  },
  json: true,
  maxAttempts: 3,
  retryDelay: 5000,
  // Adding retry on ECONNRESET as a temporary fix for PP-1727
  retryStrategy: retryStrategy
}

const client = request.defaults(requestOptions)

/**
 * @param  {Null | Object} err
 * @param  {Object} response
 * @param  {Object} body
 * @return {Boolean} true if the request should be retried
 */
function retryStrategy (err, response, body) {
  return process.env.NODE_ENV === 'production' && (err && ['ECONNRESET'].includes(err.code))
}

function makeRequest (method, opts) {
  return new Promise((resolve, reject) => {
    opts.method = method.toUpperCase()

    const loggingContext = {
      correlationId: getRequestCorrelationIDField(),
      startTime: new Date(),
      url: joinURL(lodash.get(opts, 'baseUrl', ''), opts.url),
      method: opts.method,
      description: opts.description,
      service: opts.service,
      additionalLoggingFields: opts.additionalLoggingFields
    }

    lodash.set(opts, `headers.${CORRELATION_HEADER}`, loggingContext.correlationId)
    opts.headers['Content-Type'] = opts.headers['Content-Type'] || 'application/json'

    // Set up post response and error handling method
    const transform = opts.transform || false
    opts.transform = undefined

    // start request
    requestLogger.logRequestStart(loggingContext)
    const call = client(opts, (err, response, body) => {
      if (err) {
        reject(err)
      } else if (response && SUCCESS_CODES.includes(response.statusCode)) {
        // transform our output if the appropriate function was passed.
        body = transform ? transform(body) : body
        resolve(body)
      } else {
        let errors = body && (body.message || body.errors)
        if (errors && Array.isArray(errors)) {
          errors = errors.join(', ')
        }
        const message = errors || body || 'Unknown error'
        const errorIdentifier = body && body.error_identifier
        const reason = body && body.reason
        const err = new RESTClientError(message, opts.service, response.statusCode, errorIdentifier, reason)
        reject(err)
      }
    })
    // Add event listeners for logging
    call.on('error', err => {
      requestLogger.logRequestEnd(loggingContext)
      requestLogger.logRequestError(loggingContext, err)
    })
    call.on('response', response => {
      requestLogger.logRequestEnd(loggingContext, response)
      if (!(response && SUCCESS_CODES.includes(response.statusCode))) {
        requestLogger.logRequestFailure(loggingContext, response)
      }
    })
    return call
  })
}

module.exports = {
  get: opts => makeRequest('get', opts),
  post: opts => makeRequest('post', opts),
  put: opts => makeRequest('put', opts),
  patch: opts => makeRequest('patch', opts),
  delete: opts => makeRequest('delete', opts)
}
