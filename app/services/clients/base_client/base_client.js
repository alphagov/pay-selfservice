'use strict'

const request = require('request')
const wrapper = require('./wrapper')

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

// Export base client
module.exports = {
  get: wrapper(client, 'get'),
  post: wrapper(client, 'post'),
  put: wrapper(client, 'put'),
  patch: wrapper(client, 'patch'),
  delete: wrapper(client, 'delete')
}

/**
 * @param  {Null | Object} err
 * @param  {Object} response
 * @param  {Object} body
 * @return {Boolean} true if the request should be retried
 */
function retryStrategy (err, response, body) {
  return process.env.NODE_ENV === 'production' && (err && ['ECONNRESET'].includes(err.code))
}
