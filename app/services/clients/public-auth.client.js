'use strict'

const { Client } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/axios-base-client')
const { configureClient } = require('./base/config')
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
 *  accountId: accountId
 * }
 */
async function getActiveTokensForAccount (params) {
  this.client = new Client(SERVICE_NAME)
  const url = getUrlForAccountId(params.accountId)
  configureClient(this.client, url)
  const response = await this.client.get(url, 'Get active tokens for account')
  return response.data
}

/**
 * Get revoked tokens for account
 *
 * Expects {
 *  accountId: accountId
 * }
 *
 * @param {Object} params
 * @returns {Promise}
 */
async function getRevokedTokensForAccount (params) {
  this.client = new Client(SERVICE_NAME)
  const url = `${getUrlForAccountId(params.accountId)}?state=revoked`
  configureClient(this.client, url)
  const response = await this.client.get(url, 'Get revoked tokens for account')
  return response.data
}

/**
 * Get active tokens for account
 *
 * Expects {
 *  accountId: accountId,
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
async function createTokenForAccount (params) {
  this.client = new Client(SERVICE_NAME)
  const url = process.env.PUBLIC_AUTH_URL
  configureClient(this.client, url)
  const response = await this.client.post(url, params.payload, 'create new token')
  return response.data
}

/**
 * Update a token
 *
 * Expects {
 *  accountId: accountId,
 *  payload: {
 *    token_link: token_link,
 *    description: description
 *  }
 * }
 *
 * @param {Object} params
 * @returns {Promise}
 */
async function updateToken (params) {
  this.client = new Client(SERVICE_NAME)
  const url = process.env.PUBLIC_AUTH_URL
  configureClient(this.client, url)
  const response = await this.client.put(url, params.payload, 'update token')
  return response.data
}

/**
 * Delete a token
 *
 * Expects {
 *  accountId: accountId,
 *  payload: {
 *    <token_link>: token_link,
 *    <token_hash>: token_hash
 *  }
 * }
 *
 * @param {Object} params
 * @returns {Promise}
 */
async function deleteTokenForAccount (params) {
  this.client = new Client(SERVICE_NAME)
  const url = getUrlForAccountId(params.accountId)
  configureClient(this.client, url)
  const response = await this.client.delete(url, 'delete token', { data: params.payload })
  return response.data
}

async function revokeTokensForAccount (accountId) {
  this.client = new Client(SERVICE_NAME)
  const url = `${PUBLIC_AUTH_URL}/v1/frontend/auth/${accountId}/revoke-all`
  configureClient(this.client, url)
  await this.client.delete(url, 'delete token') // how to catch error?
}

module.exports = {
  getActiveTokensForAccount,
  getRevokedTokensForAccount,
  createTokenForAccount,
  updateToken,
  deleteTokenForAccount,
  revokeTokensForAccount
}
