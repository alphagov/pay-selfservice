'use strict'

const lodash = require('lodash')
const joinURL = require('url-join')
const correlator = require('correlation-id')

const requestLogger = require('../../../utils/request-logger')
const { CORRELATION_HEADER } = require('../../../utils/correlation-header')

// Constants
const SUCCESS_CODES = [200, 201, 202, 204, 206]

module.exports = function (method, verb) {
  return (uri, opts, cb) => new Promise((resolve, reject) => {
    const args = [uri, opts, cb]
    uri = args.find(arg => typeof arg === 'string')
    opts = args.find(arg => typeof arg === 'object') || {}
    cb = args.find(arg => typeof arg === 'function')
    if (verb) opts.method = verb.toUpperCase()
    if (uri && !opts.uri && !opts.url) opts.url = uri
    const context = {
      correlationId: correlator.getId(),
      startTime: new Date(),
      url: joinURL(lodash.get(opts, 'baseUrl', ''), opts.url),
      method: opts.method,
      description: opts.description,
      service: opts.service,
      additionalLoggingFields: opts.additionalLoggingFields
    }

    // Set headers and optional x-ray trace headers
    lodash.set(opts, `headers.${CORRELATION_HEADER}`, context.correlationId)
    opts.headers['Content-Type'] = opts.headers['Content-Type'] || 'application/json'

    // Set up post response and error handling method
    const transform = opts.transform || false
    opts.transform = undefined

    // start request
    requestLogger.logRequestStart(context)
    const call = method(opts, (err, response, body) => {
      if (cb) cb(err, response, body)
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
      requestLogger.logRequestEnd(context)
      requestLogger.logRequestError(context, err)
    })
    call.on('response', response => {
      requestLogger.logRequestEnd(context, response)
      if (!(response && SUCCESS_CODES.includes(response.statusCode))) {
        requestLogger.logRequestFailure(context, response)
      }
    })
    return call
  })
}
