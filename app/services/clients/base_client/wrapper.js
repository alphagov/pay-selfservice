'use strict'

// NPM dependencies
const lodash = require('lodash')
const joinURL = require('url-join')
const correlator = require('correlation-id')
const getNamespace = require('continuation-local-storage').getNamespace
const AWSXRay = require('aws-xray-sdk')

// Local dependencies
const requestLogger = require('../../../utils/request_logger')
const CORRELATION_HEADER = require('../../../utils/correlation_header').CORRELATION_HEADER

// Constants
const SUCCESS_CODES = [200, 201, 202, 204, 206]
const clsXrayConfig = require('../../../../config/xray-cls')

module.exports = function (method, verb) {
  return (uri, opts, cb) => new Promise((resolve, reject) => {

    const namespace = getNamespace(clsXrayConfig.nameSpaceName)
    const clsSegment = namespace ? namespace.get(clsXrayConfig.segmentKeyName): null

    const args = [uri, opts, cb]
    uri = args.find(arg => typeof arg === 'string')
    opts = args.find(arg => typeof arg === 'object') || {}
    cb = args.find(arg => typeof arg === 'function')
    if (verb) opts.method = verb.toUpperCase()
    if (uri && !opts.uri && !opts.url) opts.uri = uri
    const context = {
      correlationId: correlator.getId(),
      startTime: new Date(),
      url: joinURL(lodash.get(opts, 'baseUrl', ''), opts.url),
      method: opts.method,
      description: opts.description,
      service: opts.service
    }

    // Set headers and optional x-ray trace headers
    lodash.set(opts, `headers.${CORRELATION_HEADER}`, context.correlationId)
    if (clsSegment) {
      const subSegment = opts.subSegment || new AWSXRay.Segment('_request_nbc', null, clsSegment.trace_id)
      opts.headers['X-Amzn-Trace-Id'] = 'Root=' + clsSegment.trace_id + ';Parent=' + subSegment.id + ';Sampled=1'
    }
    opts.headers['Content-Type'] = opts.headers['Content-Type'] || 'application/json'

    // Set up post response and error handling method
    const transform = opts.transform || false
    const handleError = opts.baseClientErrorHandler || 'new'
    opts.transform = undefined
    opts.baseClientErrorHandler = undefined

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
        if (handleError === 'new') {
          let errors = lodash.get(body, 'message') || lodash.get(body, 'errors')
          if (errors && errors.constructor.name === 'Array') errors = errors.join(', ')
          const err = new Error(errors || body || 'Unknown error')
          err.errorCode = response.statusCode
          reject(err)
        } else {
          reject({
            errorCode: response.statusCode,
            message: response.body
          })
        }
      }
    })
    // Add event listeners for logging
    call.on('error', err => {
      requestLogger.logRequestEnd(context)
      requestLogger.logRequestError(context, err)
    })
    call.on('response', response => {
      requestLogger.logRequestEnd(context)
      if (!(response && SUCCESS_CODES.includes(response.statusCode))) {
        requestLogger.logRequestFailure(context, response)
      }
    })
    return call



  })
}
