'use strict'

const lodash = require('lodash')
const joinURL = require('url-join')
const correlator = require('correlation-id')

const requestLogger = require('../../../utils/request-logger')
const { CORRELATION_HEADER } = require('../../../utils/correlation-header')

// Constants
const SUCCESS_CODES = [200, 201, 202, 204, 206]

/**
 *
 * @param {RequestAPI} client
 * @param {string} verb
 * @returns {function(object): Promise<unknown>}
 */
module.exports = function (client, verb) {
  return (opts) => new Promise((resolve, reject) => {
    if (verb) {
      opts.method = verb.toUpperCase()
    }
    const loggingContext = {
      correlationId: correlator.getId(),
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
        let errors = lodash.get(body, 'message') || lodash.get(body, 'errors')
        if (errors && errors.constructor.name === 'Array') errors = errors.join(', ')
        const err = new Error(errors || body || 'Unknown error')
        err.errorCode = response.statusCode
        err.errorIdentifier = lodash.get(body, 'error_identifier')
        err.reason = lodash.get(body, 'reason')
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
