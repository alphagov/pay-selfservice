'use strict'

// NPM Dependencies
const logger = require('winston')
const request = require('requestretry')
const wrapper = require('./wrapper')

// Local Dependencies
const customCertificate = require('../../../utils/custom_certificate')

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
  retryStrategy: retryOnECONNRESET()
}

if (process.env.DISABLE_INTERNAL_HTTPS !== 'true') {
  customCertificate.addCertsToAgent({options: requestOptions.agentOptions})
} else {
  logger.warn('DISABLE_INTERNAL_HTTPS is set.')
}

const client = request.defaults(requestOptions)

// Export base client
module.exports = {
  get: wrapper(client, 'get'),
  post: wrapper(client, 'post'),
  put: wrapper(client, 'put'),
  patch: wrapper(client, 'patch'),
  delete: wrapper(client, 'delete')
}

function retryOnECONNRESET (err) {
  return err && ['ECONNRESET'].includes(err.code)
}
