'use strict'

// NPM dependencies
const _ = require('lodash')
const url = require('url')
const util = require('util')
const EventEmitter = require('events').EventEmitter
const logger = require('winston')
const querystring = require('querystring')

// Local dependencies
const oldBaseClient = require('./old_base_client')
const baseClient = require('./base_client/base_client')
const requestLogger = require('../../utils/request_logger')
const createCallbackToPromiseConverter = require('../../utils/response_converter').createCallbackToPromiseConverter
const getQueryStringForParams = require('../../utils/get_query_string_for_params')
const StripeAccountSetup = require('../../models/StripeAccountSetup.class')
const StripeAccount = require('../../models/StripeAccount.class')

// Constants
const SERVICE_NAME = 'connector'
const ACCOUNTS_API_PATH = '/v1/api/accounts'
const ACCOUNT_API_PATH = ACCOUNTS_API_PATH + '/{accountId}'
const CHARGES_API_PATH = ACCOUNT_API_PATH + '/charges'
const V2_CHARGES_API_PATH = '/v2/api/accounts/{accountId}/charges'
const CHARGE_API_PATH = CHARGES_API_PATH + '/{chargeId}'
const CHARGE_REFUNDS_API_PATH = CHARGE_API_PATH + '/refunds'
const CARD_TYPES_API_PATH = '/v1/api/card-types'
const STRIPE_ACCOUNT_SETUP_PATH = ACCOUNT_API_PATH + '/stripe-setup'
const STRIPE_ACCOUNT_PATH = ACCOUNT_API_PATH + '/stripe-account'

const ACCOUNTS_FRONTEND_PATH = '/v1/frontend/accounts'
const ACCOUNT_FRONTEND_PATH = ACCOUNTS_FRONTEND_PATH + '/{accountId}'
const SERVICE_NAME_FRONTEND_PATH = ACCOUNT_FRONTEND_PATH + '/servicename'
const ACCEPTED_CARD_TYPES_FRONTEND_PATH = ACCOUNT_FRONTEND_PATH + '/card-types'
const ACCOUNT_NOTIFICATION_CREDENTIALS_PATH = '/v1/api/accounts' + '/{accountId}' + '/notification-credentials'
const ACCOUNT_CREDENTIALS_PATH = ACCOUNT_FRONTEND_PATH + '/credentials'
const EMAIL_NOTIFICATION__PATH = '/v1/api/accounts/{accountId}/email-notification'
const TOGGLE_3DS_PATH = ACCOUNTS_FRONTEND_PATH + '/{accountId}/3ds-toggle'
const TRANSACTIONS_SUMMARY = ACCOUNTS_API_PATH + '/{accountId}/transactions-summary'

const responseBodyToStripeAccountSetupTransformer = body => new StripeAccountSetup(body)
const responseBodyToStripeAccountTransformer = body => new StripeAccount(body)

/**
 * @private
 * @param  {object} self
 */
function _createResponseHandler (self) {
  return function (callback) {
    return function (error, response, body) {
      if (error || !isInArray(response.statusCode, [200, 202])) {
        if (error) {
          logger.error('Calling connector error -', {
            service: 'connector',
            error: JSON.stringify(error)
          })
        } else {
          logger.error('Calling connector response failed -', {
            service: 'connector',
            status: response.statusCode
          })
        }
        self.emit('connectorError', error, response, body)
        return
      }

      callback(body, response)
    }
  }
}

/**
 * @private
 * @param  {Object} value - value to find into the array
 * @param {Object[]} array - array source for finding the given value
 */
function isInArray (value, array) {
  return array.indexOf(value) > -1
}

/** @private */
function _accountApiUrlFor (gatewayAccountId, url) {
  return url + ACCOUNT_API_PATH.replace('{accountId}', gatewayAccountId)
}

/** @private */
function _accountUrlFor (gatewayAccountId, url) {
  return url + ACCOUNT_FRONTEND_PATH.replace('{accountId}', gatewayAccountId)
}

/** @private */
function _accountsUrlFor (gatewayAccountIds, url) {
  return url + ACCOUNTS_FRONTEND_PATH + '?accountIds=' + gatewayAccountIds.join(',')
}

/** @private */
function _accountNotificationCredentialsUrlFor (gatewayAccountId, url) {
  return url + ACCOUNT_NOTIFICATION_CREDENTIALS_PATH.replace('{accountId}', gatewayAccountId)
}

/** @private */
function _accountCredentialsUrlFor (gatewayAccountId, url) {
  return url + ACCOUNT_CREDENTIALS_PATH.replace('{accountId}', gatewayAccountId)
}

/** @private */
function _accountAcceptedCardTypesUrlFor (gatewayAccountId, url) {
  return url + ACCEPTED_CARD_TYPES_FRONTEND_PATH.replace('{accountId}', gatewayAccountId)
}

/** @private */
function _cardTypesUrlFor (url) {
  return url + CARD_TYPES_API_PATH
}

/** @private */
function _serviceNameUrlFor (gatewayAccountId, url) {
  return url + SERVICE_NAME_FRONTEND_PATH.replace('{accountId}', gatewayAccountId)
}

/** @private */
function _chargeUrlFor (gatewayAccountId, chargeId, url) {
  return url + CHARGE_API_PATH.replace('{accountId}', gatewayAccountId).replace('{chargeId}', chargeId)
}

/** @private */
function _chargeRefundsUrlFor (gatewayAccountId, chargeId, url) {
  return url + CHARGE_REFUNDS_API_PATH.replace('{accountId}', gatewayAccountId).replace('{chargeId}', chargeId)
}

/** @private */
var _getNotificationEmailUrlFor = function (accountID, url) {
  return url + EMAIL_NOTIFICATION__PATH.replace('{accountId}', accountID)
}

/** @private */
var _getToggle3dsUrlFor = function (accountID, url) {
  return url + TOGGLE_3DS_PATH.replace('{accountId}', accountID)
}

/** @private */
var _getTransactionSummaryUrlFor = function (accountID, period, url) {
  return url + TRANSACTIONS_SUMMARY.replace('{accountId}', accountID) + '?' + period
}

function searchUrl (baseUrl, params) {
  return baseUrl + V2_CHARGES_API_PATH.replace('{accountId}', params.gatewayAccountId) + '?' + getQueryStringForParams(params)
}

/**
 * Connects to connector
 * @param {string} connectorUrl connector url
 */
function ConnectorClient (connectorUrl) {
  this.connectorUrl = connectorUrl
  this.responseHandler = _createResponseHandler(this)

  EventEmitter.call(this)
}

ConnectorClient.prototype = {
  /**
   *
   * @param params
   * @param successCallback
   * @returns {ConnectorClient}
   */
  searchTransactions (params, successCallback) {
    let startTime = new Date()
    // allow url to be overridden to allow recursion using next url
    let url = params.url || searchUrl(this.connectorUrl, params)
    let responseHandler = this.responseHandler(successCallback)

    logger.debug('Calling connector to search account transactions -', {
      service: 'connector',
      method: 'GET',
      url: url
    })

    oldBaseClient.get(url, { correlationId: params.correlationId }, function (error, response, body) {
      logger.info(`[${params.correlationId}] - GET to %s ended - elapsed time: %s ms`, url, new Date() - startTime)
      responseHandler(error, response, body)
    })

    return this
  },

  /**
   *
   * @param params
   * @param successCallback
   * @returns {ConnectorClient}
   */
  getAllTransactions (params, successCallback) {
    var results = []
    var connectorClient = this
    params.pageSize = params.pageSize || 500
    var recursiveRetrieve = function (recursiveParams) {
      connectorClient.searchTransactions(recursiveParams, function (data) {
        var next = _.get(data, '_links.next_page')
        results = results.concat(data.results)
        if (next === undefined) return successCallback(results)

        recursiveParams.url = url.resolve(connectorClient.connectorUrl, next.href)
        recursiveRetrieve(recursiveParams)
      })
    }

    recursiveRetrieve(params)

    return this
  },

  /**
   * Retrieves a Charge from connector for a given charge Id that belongs to a gateway account Id
   * @param params
   *          An object with the following elements;
   *            gatewayAccountId (required)
   *            chargeId (required)
   *            correlationId (optional)
   * @param successCallback the callback to perform upon `200 OK` from connector along with connector charge object.
   *
   * @returns {ConnectorClient}
   */
  getCharge: function (params, successCallback) {
    let url = _chargeUrlFor(params.gatewayAccountId, params.chargeId, this.connectorUrl)
    logger.debug('Calling connector to get charge -', {
      service: 'connector',
      method: 'GET',
      url: url,
      chargeId: params.chargeId
    })
    oldBaseClient.get(url, { correlationId: params.correlationId }, this.responseHandler(successCallback))
    return this
  },

  /**
   * Retrieves transaction history for a given charge Id that belongs to a gateway account Id.
   * @param params
   *          An object with the following elements;
   *            gatewayAccountId (required)
   *            chargeId (required)
   *            correlationId (optional)
   * @param successCallback the callback to perform upon `200 OK` from connector along with history result set.
   * @returns {ConnectorClient}
   */
  getChargeEvents: function (params, successCallback) {
    let url = _chargeUrlFor(params.gatewayAccountId, params.chargeId, this.connectorUrl) + '/events'
    logger.debug('Calling connector to get events -', {
      service: 'connector',
      method: 'GET',
      url: url,
      chargeId: params.chargeId
    })
    oldBaseClient.get(url, params, this.responseHandler(successCallback))
    return this
  },

  /**
   * Retrieves the given gateway account
   * @param params
   *          An object with the following elements;
   *            gatewayAccountId (required)
   *            correlationId (optional)
   *@return {Promise}
   */
  getAccount: function (params) {
    return new Promise((resolve, reject) => {
      let url = _accountUrlFor(params.gatewayAccountId, this.connectorUrl)
      let startTime = new Date()
      let context = {
        url: url,
        defer: { resolve: resolve, reject: reject },
        startTime: startTime,
        correlationId: params.correlationId,
        method: 'GET',
        description: 'get an account',
        service: SERVICE_NAME
      }

      let callbackToPromiseConverter = createCallbackToPromiseConverter(context)

      oldBaseClient.get(url, params, callbackToPromiseConverter, null)
        .on('error', callbackToPromiseConverter)
    })
  },

  /**
   * Retrieves multiple gateway accounts for a given array of ids
   * @param params
   *          An object with the following elements;
   *            gatewayAccountIds (required)
   *            correlationId (optional)
   *@return {Promise}
   */
  getAccounts: function (params) {
    return new Promise((resolve, reject) => {
      let url = _accountsUrlFor(params.gatewayAccountIds, this.connectorUrl)
      let startTime = new Date()
      let context = {
        url: url,
        defer: { resolve: resolve, reject: reject },
        startTime: startTime,
        correlationId: params.correlationId,
        method: 'GET',
        description: 'get an account',
        service: SERVICE_NAME
      }

      let callbackToPromiseConverter = createCallbackToPromiseConverter(context)

      oldBaseClient.get(url, params, callbackToPromiseConverter)
        .on('error', callbackToPromiseConverter)
    })
  },

  /**
   * Creates a new gateway account
   *
   * @param paymentProvider
   * @param type
   * @param serviceName
   * @param analyticsId
   * @param correlationId
   *
   * @returns {*|Constructor|promise}
   */
  createGatewayAccount: function (paymentProvider, type, serviceName, analyticsId, correlationId) {
    return new Promise((resolve, reject) => {
      const url = this.connectorUrl + ACCOUNTS_API_PATH
      const startTime = new Date()
      const context = {
        url: url,
        defer: { resolve: resolve, reject: reject },
        startTime: startTime,
        correlationId: correlationId,
        method: 'POST',
        description: 'create a gateway account',
        service: SERVICE_NAME
      }

      const callbackToPromiseConverter = createCallbackToPromiseConverter(context)

      const params = {
        payload: {
          payment_provider: paymentProvider
        }
      }
      if (type) {
        params.payload.type = type
      }
      if (serviceName) {
        params.payload.service_name = serviceName
      }
      if (analyticsId) {
        params.payload.analytics_id = analyticsId
      }

      oldBaseClient.post(url, params, callbackToPromiseConverter)
        .on('error', callbackToPromiseConverter)
    })
  },

  /**
   *
   * @param {Object} params
   * @param {Function} successCallback
   * @returns {ConnectorClient}
   */
  patchAccountCredentials: function (params, successCallback) {
    let url = _accountCredentialsUrlFor(params.gatewayAccountId, this.connectorUrl)

    logger.debug('Calling connector to get account -', {
      service: 'connector',
      method: 'PATCH',
      url: url
    })

    oldBaseClient.patch(url, params, this.responseHandler(successCallback))
    return this
  },

  /**
   *
   * @param {Object} params
   * @param {Function} successCallback
   * @returns {ConnectorClient}
   */
  postAccountNotificationCredentials: function (params, successCallback) {
    let url = _accountNotificationCredentialsUrlFor(params.gatewayAccountId, this.connectorUrl)

    logger.debug('Calling connector to get account -', {
      service: 'connector',
      method: 'POST',
      url: url
    })

    oldBaseClient.post(url, params, this.responseHandler(successCallback))
    return this
  },

  /**
   * Retrieves the accepted card Types for the given account
   * @param params
   *          An object with the following elements;
   *            gatewayAccountId (required)
   *            correlationId (optional)
   * @param successCallback
   *          Callback function upon retrieving accepted cards successfully
   */
  getAcceptedCardsForAccount: function (params, successCallback) {
    let url = _accountAcceptedCardTypesUrlFor(params.gatewayAccountId, this.connectorUrl)

    logger.debug('Calling connector to get accepted card types for account -', {
      service: 'connector',
      method: 'GET',
      url: url
    })

    oldBaseClient.get(url, params, this.responseHandler(successCallback))
    return this
  },

  /**
   * This will replace the callback version soon
   * Retrieves the accepted card Types for the given account
   * @param gatewayAccountId (required)
   * @param correlationId (optional)
   * @returns {Promise<Object>}
   */
  getAcceptedCardsForAccountPromise: function (gatewayAccountId, correlationId) {
    return new Promise((resolve, reject) => {
      const url = _accountAcceptedCardTypesUrlFor(gatewayAccountId, this.connectorUrl)
      const params = { correlationId }
      const startTime = new Date()
      const context = {
        description: 'get accepted card types for account',
        method: 'GET',
        service: 'connector',
        url: url,
        defer: { resolve: resolve, reject: reject },
        startTime: startTime,
        correlationId
      }
      requestLogger.logRequestStart(context)

      const callbackToPromiseConverter = createCallbackToPromiseConverter(context)

      oldBaseClient.get(url, params, callbackToPromiseConverter)
        .on('error', callbackToPromiseConverter)
    })
  },

  /**
   * Updates the accepted card Types for to the given gateway account
   * @param params
   *          An object with the following elements;
   *            gatewayAccountId (required)
   *            payload (required)
   *            correlationId (optional)
   * @param successCallback
   *          Callback function upon saving accepted cards successfully
   */
  postAcceptedCardsForAccount: function (params, successCallback) {
    let url = _accountAcceptedCardTypesUrlFor(params.gatewayAccountId, this.connectorUrl)

    logger.debug('Calling connector to post accepted card types for account -', {
      service: 'connector',
      method: 'POST',
      url: url
    })

    oldBaseClient.post(url, params, this.responseHandler(successCallback))
    return this
  },

  /**
   * Retrieves all card types
   * @param params (optional)
   *          And object with the following elements;
   *            correlationId
   * @param successCallback
   *          Callback function upon successful card type retrieval
   */
  getAllCardTypes: function (params, successCallback) {
    if (typeof params === 'function') {
      successCallback = params
    }

    let url = _cardTypesUrlFor(this.connectorUrl)
    logger.debug('Calling connector to get all card types -', {
      service: 'connector',
      method: 'GET',
      url: url
    })
    oldBaseClient.get(url, params, this.responseHandler(successCallback))
    return this
  },

  /**
   * This will replace the callback version soon
   * Retrieves all card types
   * @param correlationId
   * @returns {Promise<Object>}
   */
  getAllCardTypesPromise: function (correlationId) {
    return new Promise((resolve, reject) => {
      const url = _cardTypesUrlFor(this.connectorUrl)
      const params = { correlationId }
      const startTime = new Date()
      const context = {
        description: 'get all card types',
        method: 'GET',
        service: 'connector',
        url: url,
        defer: { resolve: resolve, reject: reject },
        startTime: startTime,
        correlationId
      }
      requestLogger.logRequestStart(context)

      const callbackToPromiseConverter = createCallbackToPromiseConverter(context)

      oldBaseClient.get(url, params, callbackToPromiseConverter)
        .on('error', callbackToPromiseConverter)
    })
  },

  /**
   * @param gatewayAccountId
   * @param serviceName
   * @param correlationId
   * @returns {Promise<Object>}
   */
  patchServiceName: function (gatewayAccountId, serviceName, correlationId) {
    return new Promise((resolve, reject) => {
      const params = {
        gatewayAccountId: gatewayAccountId,
        payload: {
          service_name: serviceName
        },
        correlationId: correlationId
      }

      const url = _serviceNameUrlFor(gatewayAccountId, this.connectorUrl)
      const startTime = new Date()
      const context = {
        url: url,
        defer: { resolve: resolve, reject: reject },
        startTime: startTime,
        correlationId: correlationId,
        method: 'PATCH',
        description: 'update service name',
        service: SERVICE_NAME
      }

      const callbackToPromiseConverter = createCallbackToPromiseConverter(context)

      requestLogger.logRequestStart(context)

      oldBaseClient.patch(url, params, callbackToPromiseConverter)
        .on('error', callbackToPromiseConverter)
    })
  },

  /**
   * @param gatewayAccountId
   * @param allowApplePay (boolean)
   * @param correlationId
   * @returns {Promise<Object>}
   */
  toggleApplePay: function (gatewayAccountId, allowApplePay, correlationId) {
    return baseClient.patch(
      {
        baseUrl: this.connectorUrl,
        url: ACCOUNT_API_PATH.replace('{accountId}', gatewayAccountId),
        json: true,
        body: {
          op: 'replace',
          path: 'allow_apple_pay',
          value: allowApplePay
        },
        correlationId,
        description: 'toggle allow apple pay',
        service: SERVICE_NAME
      }
    )
  },

  /**
   * @param gatewayAccountId
   * @param allowGooglePay (boolean)
   * @param correlationId
   * @returns {Promise<Object>}
   */

  toggleGooglePay: function (gatewayAccountId, allowGooglePay, correlationId) {
    return baseClient.patch(
      {
        baseUrl: this.connectorUrl,
        url: ACCOUNT_API_PATH.replace('{accountId}', gatewayAccountId),
        json: true,
        body: {
          op: 'replace',
          path: 'allow_google_pay',
          value: allowGooglePay
        },
        correlationId,
        description: 'toggle allow google pay',
        service: SERVICE_NAME
      }
    )
  },
  /**
   * @param gatewayAccountId
   * @param gatewayMerchantId (string)
   * @param correlationId
   * @returns {Promise<Object>}
   */

  setGatewayMerchantId: function (gatewayAccountId, gatewayMerchantId, correlationId) {
    return baseClient.patch(
      {
        baseUrl: this.connectorUrl,
        url: ACCOUNT_API_PATH.replace('{accountId}', gatewayAccountId),
        json: true,
        body: {
          op: 'add',
          path: 'credentials/gateway_merchant_id',
          value: gatewayMerchantId
        },
        correlationId,
        description: 'set gateway merchant id',
        service: SERVICE_NAME
      }
    )
  },

  /**
   * Create a refund of the provided amount for the given payment
   * @param params
   *          An object with the following elements;
   *            gatewayAccountId (required)
   *            chargeId (required)
   *            payload (required)
   *            correlationId (optional)
   * @param successCallback
   *          Callback function for successful refunds
   */
  postChargeRefund: function (params, successCallback) {
    let url = _chargeRefundsUrlFor(params.gatewayAccountId, params.chargeId, this.connectorUrl)
    logger.debug('Calling connector to post a refund for payment -', {
      service: 'connector',
      method: 'POST',
      url: url,
      chargeId: params.chargeId,
      payload: params.payload
    })

    oldBaseClient.post(url, params, this.responseHandler(successCallback))
    return this
  },
  /**
   *
   * @param {Object} params
   * @param {Function} successCallback
   */
  updateConfirmationEmail: function (params, successCallback) {
    let url = _getNotificationEmailUrlFor(params.gatewayAccountId, this.connectorUrl)
    oldBaseClient.patch(url, params, this.responseHandler(successCallback))

    return this
  },

  /**
   *
   * @param {Object} params
   * @param {Function} successCallback
   */
  updateConfirmationEmailEnabled: function (params, successCallback) {
    let url = _getNotificationEmailUrlFor(params.gatewayAccountId, this.connectorUrl)
    oldBaseClient.patch(url, params, this.responseHandler(successCallback))

    return this
  },

  /**
   *
   * @param {Object} params
   * @param {Function} successCallback
   */
  updateEmailCollectionMode: function (params, successCallback) {
    let url = _accountApiUrlFor(params.gatewayAccountId, this.connectorUrl)
    oldBaseClient.patch(url, params, this.responseHandler(successCallback))

    return this
  },

  /**
   *
   * @param {Object} params
   * @param {Function} successCallback
   */
  updateRefundEmailEnabled: function (params, successCallback) {
    let url = _getNotificationEmailUrlFor(params.gatewayAccountId, this.connectorUrl)
    oldBaseClient.patch(url, params, this.responseHandler(successCallback))

    return this
  },

  /**
   *
   * @param {Object} params
   * @param {Function} successCallback
   */
  update3dsEnabled: function (params, successCallback) {
    let url = _getToggle3dsUrlFor(params.gatewayAccountId, this.connectorUrl)
    oldBaseClient.patch(url, params, this.responseHandler(successCallback))
    return this
  },

  /**
   *
   * @param {Object} params
   * @param {Function} successCallback
   */
  getTransactionSummary: function (params, successCallback, subsegment) {
    const queryStrings = {
      from_date: params.fromDateTime,
      to_date: params.toDateTime
    }
    const period = querystring.stringify(queryStrings)
    let url = _getTransactionSummaryUrlFor(params.gatewayAccountId, period, this.connectorUrl)
    oldBaseClient.get(url, params, this.responseHandler(successCallback), subsegment)

    return this
  },

  getStripeAccountSetup: function (gatewayAccountId, correlationId) {
    return baseClient.get(
      {
        baseUrl: this.connectorUrl,
        url: STRIPE_ACCOUNT_SETUP_PATH.replace('{accountId}', gatewayAccountId),
        json: true,
        correlationId,
        description: 'get stripe account setup flags for gateway account',
        service: SERVICE_NAME,
        transform: responseBodyToStripeAccountSetupTransformer,
        baseClientErrorHandler: 'old'
      }
    )
  },

  setStripeAccountSetupFlag: function (gatewayAccountId, stripeAccountSetupFlag, correlationId) {
    return baseClient.patch(
      {
        baseUrl: this.connectorUrl,
        url: STRIPE_ACCOUNT_SETUP_PATH.replace('{accountId}', gatewayAccountId),
        json: true,
        body: [
          {
            op: 'replace',
            path: stripeAccountSetupFlag,
            value: true
          }
        ],
        correlationId,
        description: 'set stripe account setup flag to true for gateway account',
        service: SERVICE_NAME,
        baseClientErrorHandler: 'old'
      }
    )
  },

  getStripeAccount: function (gatewayAccountId, correlationId) {
    return baseClient.get(
      {
        baseUrl: this.connectorUrl,
        url: STRIPE_ACCOUNT_PATH.replace('{accountId}', gatewayAccountId),
        json: true,
        correlationId,
        description: 'get stripe account for gateway account',
        service: SERVICE_NAME,
        transform: responseBodyToStripeAccountTransformer,
        baseClientErrorHandler: 'old'
      }
    )
  }
}

util.inherits(ConnectorClient, EventEmitter)

module.exports.ConnectorClient = ConnectorClient
