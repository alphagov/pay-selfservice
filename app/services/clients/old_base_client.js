'use strict'

// NPM dependences
const path = require('path')
const https = require('https')
const http = require('http')
const urlParse = require('url').parse
const _ = require('lodash')
const logger = require('winston')
const request = require('requestretry')
const getNamespace = require('continuation-local-storage').getNamespace
const AWSXRay = require('aws-xray-sdk')

// Local dependencies
const customCertificate = require('../../utils/custom_certificate')
const getRequestContext = require('../../middleware/get_request_context').getRequestContext
const CORRELATION_HEADER_NAME = require(path.join(__dirname, '/../../utils/correlation_header')).CORRELATION_HEADER

// Constants
const FEATURE_FLAGS_HEADER_NAME = 'features'
const RETRIABLE_ERRORS = ['ECONNRESET']
const agentOptions = {
  keepAlive: true,
  maxSockets: process.env.MAX_SOCKETS || 100
}
const clsXrayConfig = require('../../../config/xray-cls')

function retryOnEconnreset (err) {
  return err && _.includes(RETRIABLE_ERRORS, err.code)
}

/**
 * @type {https.Agent}
 */
const httpAgent = http.globalAgent
const httpsAgent = new https.Agent(agentOptions)

if (process.env.DISABLE_INTERNAL_HTTPS !== 'true') {
  customCertificate.addCertsToAgent(httpsAgent)
} else {
  logger.warn('DISABLE_INTERNAL_HTTPS is set.')
}

const client = request
  .defaults({
    json: true,
    // Adding retry on ECONNRESET as a temporary fix for PP-1727
    maxAttempts: 3,
    retryDelay: 5000,
    retryStrategy: retryOnEconnreset
  })

const getHeaders = function getHeaders (args, segmentData) {
  const requestContext = getRequestContext(args.correlationId || '') || {}

  let headers = {}
  headers['Content-Type'] = 'application/json'
  headers[CORRELATION_HEADER_NAME] = args.correlationId || ''
  headers[FEATURE_FLAGS_HEADER_NAME] = (requestContext.features || []).toString()

  if (segmentData.clsSegment) {
    const subSegment = segmentData.subSegment || new AWSXRay.Segment('_request', null, segmentData.clsSegment.trace_id)
    headers['X-Amzn-Trace-Id'] = 'Root=' + segmentData.clsSegment.trace_id + ';Parent=' + subSegment.id + ';Sampled=1'
  }
  _.merge(headers, args.headers)

  return headers
}
/**
 *
 * @param {string} methodName
 * @param {string} url
 * @param {Object} args
 * @param {Function} callback
 *
 * @returns {OutgoingMessage}
 *
 * @private
 */
const _request = function request (methodName, url, args, callback, subSegment) {
  const agent = urlParse(url).protocol === 'http:' ? httpAgent : httpsAgent
  const namespace = getNamespace(clsXrayConfig.nameSpaceName)
  const clsSegment = namespace ? namespace.get(clsXrayConfig.segmentKeyName) : null

  const requestOptions = {
    uri: url,
    method: methodName,
    agent: agent,
    headers: getHeaders(args, { clsSegment: clsSegment, subSegment: subSegment})
  }
  if (args.qs) {
    requestOptions.qs = args.qs
  }
  if (args.payload) {
    requestOptions.body = args.payload
  }
  return client(requestOptions, callback)
}

/*
 * @module baseClient
 */
module.exports = {
  /**
   *
   * @param {string} url
   * @param {Object} args
   * @param {function} callback
   *
   * @returns {OutgoingMessage}
   */
  get: function (url, args, callback, subsegment) {
    return _request('GET', url, args, callback, subsegment)
  },

  /**
   *
   * @param {string} url
   * @param {Object} args
   * @param {function} callback
   *
   * @returns {OutgoingMessage}
   */
  post: function (url, args, callback) {
    return _request('POST', url, args, callback)
  },

  /**
   *
   * @param {string} url
   * @param {Object} args
   * @param {function} callback
   *
   * @returns {OutgoingMessage}
   */
  put: function (url, args, callback) {
    return _request('PUT', url, args, callback)
  },

  /**
   *
   * @param {string} url
   * @param {Object} args
   * @param {function} callback
   *
   * @returns {OutgoingMessage}
   */
  patch: function (url, args, callback) {
    return _request('PATCH', url, args, callback)
  },

  /**
   *
   * @param {string} url
   * @param {Object} args
   * @param {function} callback
   *
   * @returns {OutgoingMessage}
   */
  delete: function (url, args, callback) {
    return _request('DELETE', url, args, callback)
  }
}
