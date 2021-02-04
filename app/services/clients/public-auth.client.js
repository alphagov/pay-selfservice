'use strict'

const baseClient = require('./base-client/base.client')
const { PUBLIC_AUTH_URL } = require('../../../config')
// Constants
const SERVICE_NAME = 'publicauth'

/**
 * @param {string} accountId
 */
const getUrlForAccountId = accountId => `${PUBLIC_AUTH_URL}/${accountId}`

/**
 * Get active tokens for account
 *
 * Expects {
 *  accountId: accountId,
 *  correlationId: correlationId
 * }
 */
function getActiveTokensForAccount (params) {
  const configuration = {
    url: getUrlForAccountId(params.accountId),
    correlationId: params.correlationId,
    description: 'Get active tokens for account',
    service: SERVICE_NAME
  }

  return baseClient.get(configuration)
}

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
function getRevokedTokensForAccount (params) {
  const url = `${getUrlForAccountId(params.accountId)}?state=revoked`
  const configuration = {
    url: url,
    correlationId: params.correlationId,
    description: 'Get revoked tokens for account',
    service: SERVICE_NAME
  }

  return baseClient.get(configuration)
}

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
function createTokenForAccount (params) {
  const configuration = {
    url: process.env.PUBLIC_AUTH_URL,
    correlationId: params.correlationId,
    body: {
      ...params.payload
    },
    description: 'create new token',
    service: SERVICE_NAME
  }

  return baseClient.post(configuration)
}

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
function updateToken (params) {
  const configuration = {
    url: process.env.PUBLIC_AUTH_URL,
    correlationId: params.correlationId,
    body: {
      ...params.payload
    },
    description: 'update token',
    service: SERVICE_NAME
  }

  return baseClient.put(configuration)
}

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
function deleteTokenForAccount (params) {
  let url = getUrlForAccountId(params.accountId)
  const configuration = {
    url: url,
    correlationId: params.correlationId,
    body: {
      ...params.payload
    },
    description: 'delete token',
    service: SERVICE_NAME
  }

  return baseClient.delete(configuration)
}

module.exports = {
  getActiveTokensForAccount,
  getRevokedTokensForAccount,
  createTokenForAccount,
  updateToken,
  deleteTokenForAccount
}
