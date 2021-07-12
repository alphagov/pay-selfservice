'use strict'

const logger = require('../../utils/logger')(__filename)
const baseClient = require('./base-client/base.client')
const StripeAccountSetup = require('../../models/StripeAccountSetup.class')
const StripeAccount = require('../../models/StripeAccount.class')

// Constants
const SERVICE_NAME = 'connector'
const ACCOUNTS_API_PATH = '/v1/api/accounts'
const ACCOUNT_API_PATH = ACCOUNTS_API_PATH + '/{accountId}'
const CHARGES_API_PATH = ACCOUNT_API_PATH + '/charges'
const CHARGE_API_PATH = CHARGES_API_PATH + '/{chargeId}'
const CHARGE_REFUNDS_API_PATH = CHARGE_API_PATH + '/refunds'
const CARD_TYPES_API_PATH = '/v1/api/card-types'
const STRIPE_ACCOUNT_SETUP_PATH = ACCOUNT_API_PATH + '/stripe-setup'
const STRIPE_ACCOUNT_PATH = ACCOUNT_API_PATH + '/stripe-account'
const SWITCH_PSP_PATH = ACCOUNT_API_PATH + '/switch-psp'

const ACCOUNTS_FRONTEND_PATH = '/v1/frontend/accounts'
const ACCOUNT_FRONTEND_PATH = ACCOUNTS_FRONTEND_PATH + '/{accountId}'
const ACCOUNT_BY_EXTERNAL_ID_PATH = ACCOUNTS_FRONTEND_PATH + '/external-id/{externalId}'
const SERVICE_NAME_FRONTEND_PATH = ACCOUNT_FRONTEND_PATH + '/servicename'
const ACCEPTED_CARD_TYPES_FRONTEND_PATH = ACCOUNT_FRONTEND_PATH + '/card-types'
const ACCOUNT_NOTIFICATION_CREDENTIALS_PATH = '/v1/api/accounts' + '/{accountId}' + '/notification-credentials'
const ACCOUNT_GATEWAY_ACCOUNT_CREDENTIALS_PATH = '/v1/api/accounts/{accountId}/credentials/{credentialsId}'
const EMAIL_NOTIFICATION__PATH = '/v1/api/accounts/{accountId}/email-notification'
const CHECK_WORLDPAY_3DS_FLEX_CREDENTIALS_PATH = '/v1/api/accounts/{accountId}/worldpay/check-3ds-flex-config'
const CHECK_WORLDPAY_CREDENTIALS_PATH = '/v1/api/accounts/{accountId}/worldpay/check-credentials'
const FLEX_CREDENTIALS_PATH = '/v1/api/accounts/{accountId}/3ds-flex-credentials'
const TOGGLE_3DS_PATH = ACCOUNTS_FRONTEND_PATH + '/{accountId}/3ds-toggle'

const responseBodyToStripeAccountSetupTransformer = body => new StripeAccountSetup(body)
const responseBodyToStripeAccountTransformer = body => new StripeAccount(body)

/** @private */
function _accountApiUrlFor (gatewayAccountId, url) {
  return url + ACCOUNT_API_PATH.replace('{accountId}', gatewayAccountId)
}

/** @private */
function _accountUrlFor (gatewayAccountId, url) {
  return url + ACCOUNT_FRONTEND_PATH.replace('{accountId}', gatewayAccountId)
}

/** @private */
function _accountByExternalIdUrlFor (gatewayAccountExternalId, url) {
  return url + ACCOUNT_BY_EXTERNAL_ID_PATH.replace('{externalId}', gatewayAccountExternalId)
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
function _getNotificationEmailUrlFor (accountID, url) {
  return url + EMAIL_NOTIFICATION__PATH.replace('{accountId}', accountID)
}

/** @private */
function _get3dsFlexCredentialsUrlFor (accountID, url) {
  return url + FLEX_CREDENTIALS_PATH.replace('{accountId}', accountID)
}

/** @private */
function _getToggle3dsUrlFor (accountID, url) {
  return url + TOGGLE_3DS_PATH.replace('{accountId}', accountID)
}

/**
 * Connects to connector
 * @param {string} connectorUrl connector url
 */
function ConnectorClient (connectorUrl) {
  this.connectorUrl = connectorUrl
}

ConnectorClient.prototype = {
  /**
   * Retrieves the given gateway account
   * @param params
   *          An object with the following elements;
   *            gatewayAccountId (required)
   *            correlationId (optional)
   *@return {Promise}
   */
  getAccount: function (params) {
    const url = _accountUrlFor(params.gatewayAccountId, this.connectorUrl)
    return baseClient.get(url, {
      correlationId: params.correlationId,
      description: 'get an account',
      service: SERVICE_NAME
    })
  },
  /**
   * Retrieves gateway account by external ID
   * @param params
   *          An object with the following elements;
   *            gatewayAccountExternalId (required)
   *            correlationId (optional)
   *@return {Promise}
   */
  getAccountByExternalId: function (params) {
    const url = _accountByExternalIdUrlFor(params.gatewayAccountExternalId, this.connectorUrl)
    const context = {
      url: url,
      correlationId: params.correlationId,
      description: 'get an account',
      service: SERVICE_NAME
    }

    return baseClient.get(url, context)
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
    const url = _accountsUrlFor(params.gatewayAccountIds, this.connectorUrl)
    const context = {
      url: url,
      correlationId: params.correlationId,
      description: 'get an account',
      service: SERVICE_NAME
    }

    return baseClient.get(
      url, context
    )
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
   * @returns {Promise}
   */
  createGatewayAccount: function (paymentProvider, type, serviceName, analyticsId, correlationId) {
    const url = this.connectorUrl + ACCOUNTS_API_PATH

    let payload = {
      payment_provider: paymentProvider
    }
    if (type) {
      payload.type = type
    }
    if (serviceName) {
      payload.service_name = serviceName
    }
    if (analyticsId) {
      payload.analytics_id = analyticsId
    }

    return baseClient.post(url, {
      body: payload,
      correlationId: correlationId,
      description: 'create a gateway account',
      service: SERVICE_NAME,
      baseClientErrorHandler: 'old'
    })
  },

  patchAccountGatewayAccountCredentials: function (params) {
    const url = this.connectorUrl + ACCOUNT_GATEWAY_ACCOUNT_CREDENTIALS_PATH
      .replace('{accountId}', params.gatewayAccountId)
      .replace('{credentialsId}', params.gatewayAccountCredentialsId)

    const payload = [
      {
        op: 'replace',
        path: 'credentials',
        value: params.credentials
      },
      {
        op: 'replace',
        path: 'last_updated_by_user_external_id',
        value: params.userExternalId
      }
    ]

    return baseClient.patch(url, {
      body: payload,
      correlationId: params.correlationId,
      description: 'patch gateway account credentials',
      service: SERVICE_NAME
    })
  },

  patchGooglePayGatewayMerchantId: function (gatewayAccountId, gatewayAccountCredentialsId, googlePayGatewayMerchantId, userExternalId, correlationId = '') {
    const url = this.connectorUrl + ACCOUNT_GATEWAY_ACCOUNT_CREDENTIALS_PATH
      .replace('{accountId}', gatewayAccountId)
      .replace('{credentialsId}', gatewayAccountCredentialsId)

    const payload = [
      {
        op: 'replace',
        path: 'credentials/gateway_merchant_id',
        value: googlePayGatewayMerchantId
      },
      {
        op: 'replace',
        path: 'last_updated_by_user_external_id',
        value: userExternalId
      }
    ]

    return baseClient.patch(url, {
      body: payload,
      correlationId: correlationId,
      description: 'patch gateway account credentials for google pay merchant id',
      service: SERVICE_NAME
    })
  },

  patchAccountGatewayAccountCredentialsState: function (params) {
    const url = this.connectorUrl + ACCOUNT_GATEWAY_ACCOUNT_CREDENTIALS_PATH
      .replace('{accountId}', params.gatewayAccountId)
      .replace('{credentialsId}', params.gatewayAccountCredentialsId)

    const payload = [{
      op: 'replace',
      path: 'state',
      value: params.state
    }]

    return baseClient.patch(url, {
      body: payload,
      correlationId: params.correlationId,
      description: 'patch gateway account credentials state',
      service: SERVICE_NAME
    })
  },

  /**
   *
   * @param {Object} params
   * @returns {ConnectorClient}
   */
  postAccountNotificationCredentials: function (params) {
    const url = _accountNotificationCredentialsUrlFor(params.gatewayAccountId, this.connectorUrl)

    logger.debug('Calling connector to update notification credentials', {
      service: 'connector',
      method: 'POST',
      url: url
    })

    return baseClient.post(url, {
      body: params.payload,
      correlationId: params.correlationId,
      description: 'patch gateway account credentials',
      service: SERVICE_NAME
    })
  },

  /**
   * Checks Worldpay 3DS Flex credentials
   *
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  postCheckWorldpay3dsFlexCredentials: function (params) {
    return baseClient.post(
      {
        baseUrl: this.connectorUrl,
        url: CHECK_WORLDPAY_3DS_FLEX_CREDENTIALS_PATH.replace('{accountId}', params.gatewayAccountId),
        json: true,
        body: params.payload,
        correlationId: params.correlationId,
        description: 'Check Worldpay 3DS Flex credentials',
        service: SERVICE_NAME
      }
    )
  },

  postCheckWorldpayCredentials: function (params) {
    return baseClient.post(
      {
        baseUrl: this.connectorUrl,
        url: CHECK_WORLDPAY_CREDENTIALS_PATH.replace('{accountId}', params.gatewayAccountId),
        json: true,
        body: params.payload,
        correlationId: params.correlationId,
        description: 'Check Worldpay credentials',
        service: SERVICE_NAME
      }
    )
  },

  /**
   *
   * @param {Object} params
   * @returns {Promise}
   */
  post3dsFlexAccountCredentials: function (params) {
    const url = _get3dsFlexCredentialsUrlFor(params.gatewayAccountId, this.connectorUrl)

    return baseClient.post(url, {
      body: params.payload,
      correlationId: params.correlationId,
      description: 'Update 3DS Flex credentials',
      service: SERVICE_NAME
    })
  },

  /**
   * Retrieves the accepted card Types for the given account
   * @param gatewayAccountId (required)
   * @param correlationId (optional)
   * @returns {Promise<Object>}
   */
  getAcceptedCardsForAccountPromise: function (gatewayAccountId, correlationId) {
    const url = _accountAcceptedCardTypesUrlFor(gatewayAccountId, this.connectorUrl)

    return baseClient.get(url, {
      correlationId: correlationId,
      description: 'get accepted card types for account',
      service: SERVICE_NAME
    })
  },

  /**
   * Updates the accepted card Types for to the given gateway account
   * @param gatewayAccountId (required)
   * @param payload (required)
   * @param correlationId (optional)
   * @returns {Promise<Object>}
   */
  postAcceptedCardsForAccount: function (gatewayAccountId, payload, correlationId) {
    const url = _accountAcceptedCardTypesUrlFor(gatewayAccountId, this.connectorUrl)

    return baseClient.post(url, {
      body: payload,
      correlationId: correlationId,
      description: 'post accepted card types for account',
      service: SERVICE_NAME
    })
  },

  /**
   * Retrieves all card types
   * @param correlationId
   * @returns {Promise<Object>}
   */
  getAllCardTypes: function (correlationId) {
    const url = _cardTypesUrlFor(this.connectorUrl)
    logger.debug('Calling connector to get all card types', {
      service: 'connector',
      method: 'GET',
      url: url
    })

    return baseClient.get(url, {
      url: url,
      correlationId: correlationId,
      description: 'Retrieves all card types',
      service: SERVICE_NAME
    })
  },

  /**
   * @param gatewayAccountId
   * @param serviceName
   * @param correlationId
   * @returns {Promise<Object>}
   */
  patchServiceName: function (gatewayAccountId, serviceName, correlationId) {
    const url = _serviceNameUrlFor(gatewayAccountId, this.connectorUrl)

    return baseClient.patch(url, {
      url: url,
      body: {
        service_name: serviceName
      },
      correlationId: correlationId,
      description: 'update service name',
      service: SERVICE_NAME
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
   * @param isMaskCardNumber (boolean)
   * @param correlationId
   * @returns {Promise<Object>}
   */
  toggleMotoMaskCardNumberInput: function (gatewayAccountId, isMaskCardNumber, correlationId) {
    return baseClient.patch(
      {
        baseUrl: this.connectorUrl,
        url: ACCOUNT_API_PATH.replace('{accountId}', gatewayAccountId),
        json: true,
        body: {
          op: 'replace',
          path: 'moto_mask_card_number_input',
          value: isMaskCardNumber
        },
        correlationId,
        description: 'Toggle gateway account card number masking setting',
        service: SERVICE_NAME
      }
    )
  },

  /**
   * @param gatewayAccountId
   * @param isMaskSecurityCode (boolean)
   * @param correlationId
   * @returns {Promise<Object>}
   */
  toggleMotoMaskSecurityCodeInput: function (gatewayAccountId, isMaskSecurityCode, correlationId) {
    return baseClient.patch(
      {
        baseUrl: this.connectorUrl,
        url: ACCOUNT_API_PATH.replace('{accountId}', gatewayAccountId),
        json: true,
        body: {
          op: 'replace',
          path: 'moto_mask_card_security_code_input',
          value: isMaskSecurityCode
        },
        correlationId,
        description: 'Toggle gateway account card security code masking setting',
        service: SERVICE_NAME
      }
    )
  },

  /**
   * @param gatewayAccountId
   * @param chargeId
   * @param payload
   * @param correlationId
   * @returns {Promise<Object>}
   */
  postChargeRefund: function (gatewayAccountId, chargeId, payload, correlationId) {
    return baseClient.post(
      {
        baseUrl: this.connectorUrl,
        url: CHARGE_REFUNDS_API_PATH.replace('{accountId}', gatewayAccountId).replace('{chargeId}', chargeId),
        json: true,
        body: payload,
        correlationId,
        description: 'submit refund',
        service: SERVICE_NAME
      }
    )
  },
  /**
   *
   * @param {Object} params
   */
  updateConfirmationEmail: function (params) {
    const url = _getNotificationEmailUrlFor(params.gatewayAccountId, this.connectorUrl)

    return baseClient.patch(url, {
      body: params.payload,
      correlationId: params.correlationId,
      description: 'update confirmation email',
      service: SERVICE_NAME
    })
  },

  /**
   *
   * @param {Object} params
   */
  updateConfirmationEmailEnabled: function (params) {
    const url = _getNotificationEmailUrlFor(params.gatewayAccountId, this.connectorUrl)

    return baseClient.patch(url, {
      body: params.payload,
      correlationId: params.correlationId,
      description: 'update confirmation email enabled',
      service: SERVICE_NAME
    })
  },

  /**
   *
   * @param {Object} params
   */
  updateEmailCollectionMode: function (params) {
    const url = _accountApiUrlFor(params.gatewayAccountId, this.connectorUrl)

    return baseClient.patch(url, {
      body: params.payload,
      correlationId: params.correlationId,
      description: 'update email collection mode',
      service: SERVICE_NAME
    })
  },

  /**
   *
   * @param {Object} params
   */
  updateRefundEmailEnabled: function (params) {
    const url = _getNotificationEmailUrlFor(params.gatewayAccountId, this.connectorUrl)

    return baseClient.patch(url, {
      body: params.payload,
      correlationId: params.correlationId,
      description: 'update refund email enabled',
      service: SERVICE_NAME
    })
  },

  /**
   * Update whether 3DS is on/off
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  update3dsEnabled: function (params) {
    const url = _getToggle3dsUrlFor(params.gatewayAccountId, this.connectorUrl)

    return baseClient.patch(url, {
      url: url,
      body: params.payload,
      correlationId: params.correlationId,
      description: 'Update whether 3DS is on or off',
      service: SERVICE_NAME
    })
  },

  /**
   * @param gatewayAccountId
   * @param integrationVersion3ds (number)
   * @param correlationId
   * @returns {Promise<Object>}
   */
  updateIntegrationVersion3ds: function (gatewayAccountId, integrationVersion3ds, correlationId) {
    return baseClient.patch(
      {
        baseUrl: this.connectorUrl,
        url: ACCOUNT_API_PATH.replace('{accountId}', gatewayAccountId),
        json: true,
        body: {
          op: 'replace',
          path: 'integration_version_3ds',
          value: integrationVersion3ds
        },
        correlationId,
        description: 'Set the 3DS integration version to use when authorising with the gateway',
        service: SERVICE_NAME
      }
    )
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
  },

  postChargeRequest: function (gatewayAccountId, payload) {
    return baseClient.post(
      {
        baseUrl: this.connectorUrl,
        url: CHARGES_API_PATH.replace('{accountId}', gatewayAccountId),
        json: true,
        body: payload,
        description: 'create payment',
        service: SERVICE_NAME
      }
    )
  },

  getCharge: function (gatewayAccountId, chargeExternalId) {
    const url = this.connectorUrl + CHARGE_API_PATH.replace('{accountId}', gatewayAccountId).replace('{chargeId}', chargeExternalId)
    return baseClient.get(url, {
      description: 'get a charge',
      service: SERVICE_NAME
    })
  },

  postAccountSwitchPSP: function (gatewayAccountId, payload, correlationId) {
    const url = this.connectorUrl + SWITCH_PSP_PATH.replace('{accountId}', gatewayAccountId)
    return baseClient.post(url, {
      body: payload,
      correlationId: correlationId,
      description: 'switch account payment service provider',
      service: SERVICE_NAME
    })
  }
}

module.exports.ConnectorClient = ConnectorClient
