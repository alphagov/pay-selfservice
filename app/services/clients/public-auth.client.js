'use strict'

// Local dependencies
const requestLogger = require('../../utils/request-logger')
const createCallbackToPromiseConverter = require('../../utils/response-converter').createCallbackToPromiseConverter
const baseClient = require('./old-base.client')

// Constants
const SERVICE_NAME = 'publicauth'

/**
 * @param {string} accountId
 */
const getUrlForAccountId = accountId => `${process.env.PUBLIC_AUTH_URL}/${accountId}`

module.exports = {
  /**
   * Get active tokens for account
   *
   * Expects {
   *  accountId: accountId,
   *  correlationId: correlationId
   * }
   *
   * @param {Object} params
   * @returns {Promise}
   */
  getActiveTokensForAccount: (params) => {
    return new Promise(function (resolve, reject) {
      let url = getUrlForAccountId(params.accountId)
      let startTime = new Date()
      let context = {
        url: url,
        defer: { resolve: resolve, reject: reject },
        startTime: startTime,
        correlationId: params.correlationId,
        method: 'GET',
        description: 'get active tokens',
        service: SERVICE_NAME
      }
      let callbackToPromiseConverter = createCallbackToPromiseConverter(context)

      requestLogger.logRequestStart(context)

      baseClient.get(url, params, callbackToPromiseConverter)
        .on('error', callbackToPromiseConverter)
    })
  },

  /**
   * Get revoked tokens for account
   *
   * Expects {
   *  accountId: accountId,
   *  correlationId: correlationId
   * }
   *
   * @param {Object} params
   * @returns {Promise}
   */
  getRevokedTokensForAccount: (params) => {
    return new Promise(function (resolve, reject) {
      let url = `${getUrlForAccountId(params.accountId)}?state=revoked`
      let startTime = new Date()
      let context = {
        url: url,
        defer: { resolve: resolve, reject: reject },
        startTime: startTime,
        correlationId: params.correlationId,
        method: 'GET',
        description: 'get revoked tokens',
        service: SERVICE_NAME
      }
      let callbackToPromiseConverter = createCallbackToPromiseConverter(context)

      requestLogger.logRequestStart(context)

      baseClient.get(url, params, callbackToPromiseConverter)
        .on('error', callbackToPromiseConverter)
    })
  },

  /**
   * Get active tokens for account
   *
   * Expects {
   *  accountId: accountId,
   *  correlationId: correlationId,
   *  payload: {
   *    account_id: accountId,
   *    created_by: (email of creator)
   *    description: description,
   *  }
   * }
   *
   * @param {Object} params
   * @returns {Promise}
   */
  createTokenForAccount: (params) => {
    return new Promise(function (resolve, reject) {
      let url = process.env.PUBLIC_AUTH_URL
      let startTime = new Date()
      let context = {
        url: url,
        defer: { resolve: resolve, reject: reject },
        startTime: startTime,
        correlationId: params.correlationId,
        method: 'POST',
        description: 'create new token',
        service: SERVICE_NAME
      }
      let callbackToPromiseConverter = createCallbackToPromiseConverter(context)

      requestLogger.logRequestStart(context)

      baseClient.post(url, params, callbackToPromiseConverter)
        .on('error', callbackToPromiseConverter)
    })
  },

  /**
   * Update a token
   *
   * Expects {
   *  accountId: accountId,
   *  correlationId: correlationId,
   *  payload: {
   *    token_link: token_link,
   *    description: description
   *  }
   * }
   *
   * @param {Object} params
   * @returns {Promise}
   */
  updateToken: (params) => {
    return new Promise(function (resolve, reject) {
      let url = process.env.PUBLIC_AUTH_URL
      let startTime = new Date()
      let context = {
        url: url,
        defer: { resolve: resolve, reject: reject },
        startTime: startTime,
        correlationId: params.correlationId,
        method: 'PUT',
        description: 'update token',
        service: SERVICE_NAME
      }
      let callbackToPromiseConverter = createCallbackToPromiseConverter(context)

      requestLogger.logRequestStart(context)

      baseClient.put(url, params, callbackToPromiseConverter)
        .on('error', callbackToPromiseConverter)
    })
  },

  /**
   * Delete a token
   *
   * Expects {
   *  accountId: accountId,
   *  correlationId: correlationId,
   *  payload: {
   *    <token_link>: token_link,
   *    <token_hash>: token_hash
   *  }
   * }
   *
   * @param {Object} params
   * @returns {Promise}
   */
  deleteTokenForAccount: (params) => {
    return new Promise(function (resolve, reject) {
      let url = getUrlForAccountId(params.accountId)
      let startTime = new Date()
      let context = {
        url: url,
        defer: { resolve: resolve, reject: reject },
        startTime: startTime,
        correlationId: params.correlationId,
        method: 'DELETE',
        description: 'delete token',
        service: SERVICE_NAME
      }
      let callbackToPromiseConverter = createCallbackToPromiseConverter(context)

      requestLogger.logRequestStart(context)

      baseClient.delete(url, params, callbackToPromiseConverter)
        .on('error', callbackToPromiseConverter)
    })
  }
}
