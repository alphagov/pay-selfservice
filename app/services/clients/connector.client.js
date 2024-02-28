'use strict'

const logger = require('../../utils/logger')(__filename)
const { Client } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/axios-base-client')
const { configureClient } = require('./base/config')
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
const CANCEL_AGREEMENT_PATH = '/v1/api/accounts/{accountId}/agreements/{agreementId}/cancel'

const responseBodyToStripeAccountSetupTransformer = body => new StripeAccountSetup(body)
const responseBodyToStripeAccountTransformer = body => new StripeAccount(body)

/** @private */
function _accountApiUrlFor (gatewayAccountId) {
  return ACCOUNT_API_PATH.replace('{accountId}', gatewayAccountId)
}

/** @private */
function _accountUrlFor (gatewayAccountId) {
  return ACCOUNT_API_PATH.replace('{accountId}', gatewayAccountId)
}

/** @private */
function _accountByExternalIdUrlFor (gatewayAccountExternalId) {
  return ACCOUNT_BY_EXTERNAL_ID_PATH.replace('{externalId}', gatewayAccountExternalId)
}

/** @private */
function _accountsUrlFor (gatewayAccountIds) {
  return ACCOUNTS_API_PATH + '?accountIds=' + gatewayAccountIds.join(',')
}

/** @private */
function _accountNotificationCredentialsUrlFor (gatewayAccountId) {
  return ACCOUNT_NOTIFICATION_CREDENTIALS_PATH.replace('{accountId}', gatewayAccountId)
}

/** @private */
function _accountAcceptedCardTypesUrlFor (gatewayAccountId) {
  return ACCEPTED_CARD_TYPES_FRONTEND_PATH.replace('{accountId}', gatewayAccountId)
}

/** @private */
function _serviceNameUrlFor (gatewayAccountId) {
  return SERVICE_NAME_FRONTEND_PATH.replace('{accountId}', gatewayAccountId)
}

/** @private */
function _getNotificationEmailUrlFor (accountID) {
  return EMAIL_NOTIFICATION__PATH.replace('{accountId}', accountID)
}

/** @private */
function _get3dsFlexCredentialsUrlFor (accountID) {
  return FLEX_CREDENTIALS_PATH.replace('{accountId}', accountID)
}

/** @private */
function _getCancelAgreementPathFor (accountId, agreementId) {
  return CANCEL_AGREEMENT_PATH
    .replace('{accountId}', accountId)
    .replace('{agreementId}', agreementId)
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
   *@return {Promise}
   */
  getAccount: async function (params) {
    const url = `${this.connectorUrl}${_accountUrlFor(params.gatewayAccountId)}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.get(url, 'get an account')
    return response.data
  },
  /**
   * Retrieves gateway account by external ID
   * @param params
   *          An object with the following elements;
   *            gatewayAccountExternalId (required)
   *@return {Promise}
   */
  getAccountByExternalId: async function (params) {
    const url = `${this.connectorUrl}${_accountByExternalIdUrlFor(params.gatewayAccountExternalId)}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.get(url, 'get an account')
    return response.data
  },

  /**
   * Retrieves multiple gateway accounts for a given array of ids
   * @param params
   *          An object with the following elements;
   *            gatewayAccountIds (required)
   *@return {Promise}
   */
  getAccounts: async function (params) {
    const url = `${this.connectorUrl}${_accountsUrlFor(params.gatewayAccountIds)}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.get(url, 'get an account')
    return response.data
  },

  /**
   * Creates a new gateway account
   *
   * @param paymentProvider
   * @param type
   * @param serviceName
   * @param analyticsId
   *
   * @returns {Promise}
   */
  createGatewayAccount: async function (paymentProvider, type, serviceName, analyticsId, serviceId) {
    let payload = {
      payment_provider: paymentProvider
    }
    if (type) {
      payload.type = type
    }
    if (serviceName) {
      payload.service_name = serviceName
    }
    if (serviceId) {
      payload.service_id = serviceId
    }
    if (analyticsId) {
      payload.analytics_id = analyticsId
    }

    const url = `${this.connectorUrl}${ACCOUNTS_API_PATH}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.post(url, payload, 'create a gateway account')
    return response.data
  },

  patchAccountGatewayAccountCredentials: async function (params) {
    const url = `${this.connectorUrl}${ACCOUNT_GATEWAY_ACCOUNT_CREDENTIALS_PATH}`
      .replace('{accountId}', params.gatewayAccountId)
      .replace('{credentialsId}', params.gatewayAccountCredentialsId)

    const payload = [
      {
        op: 'replace',
        path: params.path,
        value: params.credentials
      },
      {
        op: 'replace',
        path: 'last_updated_by_user_external_id',
        value: params.userExternalId
      }
    ]

    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.patch(url, payload, 'patch gateway account credentials')
    return response.data
  },

  patchGooglePayGatewayMerchantId: async function (gatewayAccountId, gatewayAccountCredentialsId, googlePayGatewayMerchantId, userExternalId) {
    const url = `${this.connectorUrl}${ACCOUNT_GATEWAY_ACCOUNT_CREDENTIALS_PATH}`
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

    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.patch(url, payload, 'patch gateway account credentials for google pay merchant id')
    return response.data
  },

  patchAccountGatewayAccountCredentialsState: async function (params) {
    const url = `${this.connectorUrl}${ACCOUNT_GATEWAY_ACCOUNT_CREDENTIALS_PATH}`
      .replace('{accountId}', params.gatewayAccountId)
      .replace('{credentialsId}', params.gatewayAccountCredentialsId)

    const payload = [
      {
        op: 'replace',
        path: 'state',
        value: params.state
      },
      {
        op: 'replace',
        path: 'last_updated_by_user_external_id',
        value: params.userExternalId
      }]

    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.patch(url, payload, 'patch gateway account credentials state')
    return response.data
  },

  /**
   *
   * @param {Object} params
   * @returns {ConnectorClient}
   */
  postAccountNotificationCredentials: async function (params) {
    const url = `${this.connectorUrl}${_accountNotificationCredentialsUrlFor(params.gatewayAccountId)}`
    logger.debug('Calling connector to update notification credentials', {
      service: 'connector',
      method: 'POST',
      url: url
    })
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.post(url, params.payload, 'patch gateway account credentials')
    return response.data
  },

  /**
   * Checks Worldpay 3DS Flex credentials
   *
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  postCheckWorldpay3dsFlexCredentials: async function (params) {
    const url = `${this.connectorUrl}${CHECK_WORLDPAY_3DS_FLEX_CREDENTIALS_PATH.replace('{accountId}', params.gatewayAccountId)}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.post(url, params.payload, 'patch gateway account credentials')
    return response.data
  },

  postCheckWorldpayCredentials: async function (params) {
    const url = `${this.connectorUrl}${CHECK_WORLDPAY_CREDENTIALS_PATH.replace('{accountId}', params.gatewayAccountId)}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.post(url, params.payload, 'Check Worldpay credentials')
    return response.data
  },

  /**
   *
   * @param {Object} params
   * @returns {Promise}
   */
  post3dsFlexAccountCredentials: async function (params) {
    const url = `${this.connectorUrl}${_get3dsFlexCredentialsUrlFor(params.gatewayAccountId)}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.post(url, params.payload, 'Update 3DS Flex credentials')
    return response.data
  },

  /**
   *
   * @param {Object} params
   * @returns {Promise}
   */
  postCancelAgreement: async function (params) {
    const url = `${this.connectorUrl}${_getCancelAgreementPathFor(params.gatewayAccountId, params.agreementId)}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.post(url, params.payload, 'Cancel agreement')
    return response.data
  },

  /**
   * Retrieves the accepted card Types for the given account
   * @param gatewayAccountId (required)
   * @returns {Promise<Object>}
   */
  getAcceptedCardsForAccountPromise: async function (gatewayAccountId) {
    const url = `${this.connectorUrl}${_accountAcceptedCardTypesUrlFor(gatewayAccountId)}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.get(url, 'get accepted card types for account')
    return response.data
  },

  /**
   * Updates the accepted card Types for to the given gateway account
   * @param gatewayAccountId (required)
   * @param payload (required)
   * @returns {Promise<Object>}
   */
  postAcceptedCardsForAccount: async function (gatewayAccountId, payload) {
    const url = `${this.connectorUrl}${_accountAcceptedCardTypesUrlFor(gatewayAccountId)}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.post(url, payload, 'post accepted card types for account')
    return response.data
  },

  /**
   * Retrieves all card types
   * @returns {Promise<Object>}
   */
  getAllCardTypes: async function () {
    const url = `${this.connectorUrl}${CARD_TYPES_API_PATH}`
    logger.debug('Calling connector to get all card types', {
      service: 'connector',
      method: 'GET',
      url: url
    })
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.get(url, 'Retrieves all card types')
    return response.data
  },

  /**
   * @param gatewayAccountId
   * @param serviceName
   * @returns {Promise<Object>}
   */
  patchServiceName: async function (gatewayAccountId, serviceName) {
    const url = `${this.connectorUrl}${_serviceNameUrlFor(gatewayAccountId)}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.patch(url, { service_name: serviceName }, 'update service name')
    return response.data
  },

  /**
   * @param gatewayAccountId
   * @param allowApplePay (boolean)
   * @returns {Promise<Object>}
   */
  toggleApplePay: async function (gatewayAccountId, allowApplePay) {
    const url = `${this.connectorUrl}${ACCOUNT_API_PATH.replace('{accountId}', gatewayAccountId)}`
    const body = {
      op: 'replace',
      path: 'allow_apple_pay',
      value: allowApplePay
    }
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.patch(url, body, 'toggle allow apple pay')
    return response.data
  },

  /**
   * @param gatewayAccountId
   * @param allowGooglePay (boolean)
   * @returns {Promise<Object>}
   */
  toggleGooglePay: async function (gatewayAccountId, allowGooglePay) {
    const url = `${this.connectorUrl}${ACCOUNT_API_PATH.replace('{accountId}', gatewayAccountId)}`
    const body = {
      op: 'replace',
      path: 'allow_google_pay',
      value: allowGooglePay
    }
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.patch(url, body, 'toggle allow google pay')
    return response.data
  },

  /**
   * @param gatewayAccountId
   * @param isMaskCardNumber (boolean)
   * @returns {Promise<Object>}
   */
  toggleMotoMaskCardNumberInput: async function (gatewayAccountId, isMaskCardNumber) {
    const url = `${this.connectorUrl}${ACCOUNT_API_PATH.replace('{accountId}', gatewayAccountId)}`
    const body = {
      op: 'replace',
      path: 'moto_mask_card_number_input',
      value: isMaskCardNumber
    }
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.patch(url, body, 'Toggle gateway account card number masking setting')
    return response.data
  },

  /**
   * @param gatewayAccountId
   * @param isMaskSecurityCode (boolean)
   * @returns {Promise<Object>}
   */
  toggleMotoMaskSecurityCodeInput: async function (gatewayAccountId, isMaskSecurityCode) {
    const url = `${this.connectorUrl}${ACCOUNT_API_PATH.replace('{accountId}', gatewayAccountId)}`
    const body = {
      op: 'replace',
      path: 'moto_mask_card_security_code_input',
      value: isMaskSecurityCode
    }
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.patch(url, body, 'Toggle gateway account card security code masking setting')
    return response.data
  },

  /**
   * @param gatewayAccountId
   * @param chargeId
   * @param payload
   * @returns {Promise<Object>}
   */
  postChargeRefund: async function (gatewayAccountId, chargeId, payload) {
    const url = `${this.connectorUrl}${CHARGE_REFUNDS_API_PATH.replace('{accountId}', gatewayAccountId).replace('{chargeId}', chargeId)}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.post(url, payload, 'submit refund')
    return response.data
  },
  /**
   *
   * @param {Object} params
   */
  updateConfirmationEmail: async function (params) {
    const url = `${this.connectorUrl}${_getNotificationEmailUrlFor(params.gatewayAccountId)}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.patch(url, params.payload, 'update confirmation email')
    return response.data
  },

  /**
   *
   * @param {Object} params
   */
  updateConfirmationEmailEnabled: async function (params) {
    const url = `${this.connectorUrl}${_getNotificationEmailUrlFor(params.gatewayAccountId)}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.patch(url, params.payload, 'update confirmation email')
    return response.data
  },

  /**
   *
   * @param {Object} params
   */
  updateEmailCollectionMode: async function (params) {
    const url = `${this.connectorUrl}${_accountApiUrlFor(params.gatewayAccountId)}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.patch(url, params.payload, 'update email collection mode')
    return response.data
  },

  /**
   *
   * @param {Object} params
   */
  updateRefundEmailEnabled: async function (params) {
    const url = `${this.connectorUrl}${_getNotificationEmailUrlFor(params.gatewayAccountId)}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.patch(url, params.payload, 'update refund email enabled')
    return response.data
  },

  /**
   * @param gatewayAccountId
   * @param integrationVersion3ds (number)
   * @returns {Promise<Object>}
   */
  updateIntegrationVersion3ds: async function (gatewayAccountId, integrationVersion3ds) {
    const url = `${this.connectorUrl}${ACCOUNT_API_PATH.replace('{accountId}', gatewayAccountId)}`
    const body = {
      op: 'replace',
      path: 'integration_version_3ds',
      value: integrationVersion3ds
    }
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.patch(url, body, 'Set the 3DS integration version to use when authorising with the gateway')
    return response.data
  },

  getStripeAccountSetup: async function (gatewayAccountId) {
    const url = `${this.connectorUrl}${STRIPE_ACCOUNT_SETUP_PATH.replace('{accountId}', gatewayAccountId)}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.get(url, 'get stripe account setup flags for gateway account')
    return responseBodyToStripeAccountSetupTransformer(response.data)
  },

  setStripeAccountSetupFlag: async function (gatewayAccountId, stripeAccountSetupFlag) {
    const url = `${this.connectorUrl}${STRIPE_ACCOUNT_SETUP_PATH.replace('{accountId}', gatewayAccountId)}`
    const body = [
      {
        op: 'replace',
        path: stripeAccountSetupFlag,
        value: true
      }
    ]
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.patch(url, body, 'set stripe account setup flag to true for gateway account')
    return response.data
  },

  getStripeAccount: async function (gatewayAccountId) {
    const url = `${this.connectorUrl}${STRIPE_ACCOUNT_PATH.replace('{accountId}', gatewayAccountId)}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.get(url, 'get stripe account for gateway account')
    return responseBodyToStripeAccountTransformer(response.data)
  },

  postChargeRequest: async function (gatewayAccountId, payload) {
    const url = `${this.connectorUrl}${CHARGES_API_PATH.replace('{accountId}', gatewayAccountId)}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.post(url, payload, 'create payment')
    return response.data
  },

  getCharge: async function (gatewayAccountId, chargeExternalId) {
    const url = `${this.connectorUrl}${CHARGE_API_PATH.replace('{accountId}', gatewayAccountId).replace('{chargeId}', chargeExternalId)}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.get(url, 'get a charge')
    return response.data
  },

  postAccountSwitchPSP: async function (gatewayAccountId, payload) {
    const url = `${this.connectorUrl}${SWITCH_PSP_PATH.replace('{accountId}', gatewayAccountId)}`
    this.client = new Client(SERVICE_NAME)
    configureClient(this.client, url)
    const response = await this.client.post(url, payload, 'get a charge')
    return response.data
  }
}

module.exports.ConnectorClient = ConnectorClient
