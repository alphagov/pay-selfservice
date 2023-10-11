'use strict'

const logger = require('../../utils/logger')(__filename)
const StripeAccountSetup = require('../../models/StripeAccountSetup.class')
const StripeAccount = require('../../models/StripeAccount.class')
const { Client } = require('./base-client/axios-base-client')
const { configureClient } = require('./base-client/config')

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
  this.client = new Client(SERVICE_NAME)
  configureClient(this.client, connectorUrl)
}

ConnectorClient.prototype = {
  /**
   * Retrieves the given gateway account
   * @param params
   *          An object with the following elements;
   *            gatewayAccountId (required)
   *@return {Promise}
   */
  getAccount: function (params) {
    const url = _accountUrlFor(params.gatewayAccountId)
    return this.client._axios.get(url, { description: 'get an account' })
      .then(response => response.data)
  },
  /**
   * Retrieves gateway account by external ID
   * @param params
   *          An object with the following elements;
   *            gatewayAccountExternalId (required)
   *@return {Promise}
   */
  getAccountByExternalId: function (params) {
    const url = _accountByExternalIdUrlFor(params.gatewayAccountExternalId)
    return this.client._axios.get(url, { description: 'get an account' })
      .then(response => response.data)
  },

  /**
   * Retrieves multiple gateway accounts for a given array of ids
   * @param params
   *          An object with the following elements;
   *            gatewayAccountIds (required)
   *@return {Promise}
   */
  getAccounts: function (params) {
    const url = _accountsUrlFor(params.gatewayAccountIds)
    return this.client._axios.get(url, { description: 'get an account' })
      .then(response => response.data)
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
  createGatewayAccount: function (paymentProvider, type, serviceName, analyticsId, serviceId) {
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

    return this.client._axios.post(ACCOUNTS_API_PATH, payload,
      { description: 'create a gateway account' })
      .then(response => response.data)
  },

  patchAccountGatewayAccountCredentials: function (params) {
    const url = ACCOUNT_GATEWAY_ACCOUNT_CREDENTIALS_PATH
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

    return this.client._axios.patch(url, payload,
      { description: 'patch gateway account credentials' })
      .then(response => response.data)
  },

  patchGooglePayGatewayMerchantId: function (gatewayAccountId, gatewayAccountCredentialsId, googlePayGatewayMerchantId, userExternalId) {
    const url = ACCOUNT_GATEWAY_ACCOUNT_CREDENTIALS_PATH
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

    return this.client._axios.patch(url, payload,
      { description: 'patch gateway account credentials for google pay merchant id' })
      .then(response => response.data)
  },

  patchAccountGatewayAccountCredentialsState: function (params) {
    const url = ACCOUNT_GATEWAY_ACCOUNT_CREDENTIALS_PATH
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

    return this.client._axios.patch(url, payload,
      { description: 'patch gateway account credentials state' })
      .then(response => response.data)
  },

  /**
   *
   * @param {Object} params
   * @returns {ConnectorClient}
   */
  postAccountNotificationCredentials: function (params) {
    const url = _accountNotificationCredentialsUrlFor(params.gatewayAccountId)

    logger.debug('Calling connector to update notification credentials', {
      service: 'connector',
      method: 'POST',
      url: url
    })

    return this.client._axios.post(url, params.payload,
      { description: 'patch gateway account credentials' })
      .then(response => response.data)
  },

  /**
   * Checks Worldpay 3DS Flex credentials
   *
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  postCheckWorldpay3dsFlexCredentials: function (params) {
    const url = CHECK_WORLDPAY_3DS_FLEX_CREDENTIALS_PATH.replace('{accountId}', params.gatewayAccountId)
    return this.client._axios.post(url, params.payload,
      { description: 'Check Worldpay 3DS Flex credentials' })
      .then(response => response.data)
  },

  postCheckWorldpayCredentials: function (params) {
    const url = CHECK_WORLDPAY_CREDENTIALS_PATH.replace('{accountId}', params.gatewayAccountId)
    return this.client._axios.post(url, params.payload,
      { description: 'Check Worldpay credentials' })
      .then(response => response.data)
  },

  /**
   *
   * @param {Object} params
   * @returns {Promise}
   */
  post3dsFlexAccountCredentials: function (params) {
    const url = _get3dsFlexCredentialsUrlFor(params.gatewayAccountId)

    return this.client._axios.post(url, params.payload,
      { description: 'Update 3DS Flex credentials' })
      .then(response => response.data)
  },

  /**
   *
   * @param {Object} params
   * @returns {Promise}
   */
  postCancelAgreement: function (params) {
    const url = _getCancelAgreementPathFor(params.gatewayAccountId, params.agreementId)

    return this.client._axios.post(url, params.payload,
      { description: 'Cancel agreement' })
      .then(response => response.data)
  },

  /**
   * Retrieves the accepted card Types for the given account
   * @param gatewayAccountId (required)
   * @returns {Promise<Object>}
   */
  getAcceptedCardsForAccountPromise: function (gatewayAccountId) {
    const url = _accountAcceptedCardTypesUrlFor(gatewayAccountId)

    return this.client._axios.get(url, { description: 'get accepted card types for account' })
      .then(response => response.data)
  },

  /**
   * Updates the accepted card Types for to the given gateway account
   * @param gatewayAccountId (required)
   * @param payload (required)
   * @returns {Promise<Object>}
   */
  postAcceptedCardsForAccount: function (gatewayAccountId, payload) {
    const url = _accountAcceptedCardTypesUrlFor(gatewayAccountId)

    return this.client._axios.post(url, payload,
      { description: 'post accepted card types for account' })
      .then(response => response.data)
  },

  /**
   * Retrieves all card types
   * @returns {Promise<Object>}
   */
  getAllCardTypes: function () {
    const url = CARD_TYPES_API_PATH

    return this.client._axios.get(url, { description: 'Retrieves all card types' })
      .then(response => response.data)
  },

  /**
   * @param gatewayAccountId
   * @param serviceName
   * @returns {Promise<Object>}
   */
  patchServiceName: function (gatewayAccountId, serviceName) {
    const url = _serviceNameUrlFor(gatewayAccountId)

    const payload = {
      service_name: serviceName
    }
    return this.client._axios.patch(url, payload,
      { description: 'update service name' })
      .then(response => response.data)
  },

  /**
   * @param gatewayAccountId
   * @param allowApplePay (boolean)
   * @returns {Promise<Object>}
   */
  toggleApplePay: function (gatewayAccountId, allowApplePay) {
    const url = ACCOUNT_API_PATH.replace('{accountId}', gatewayAccountId)
    const payload = {
      op: 'replace',
      path: 'allow_apple_pay',
      value: allowApplePay
    }
    return this.client._axios.patch(url, payload,
      { description: 'toggle allow apple pay' })
      .then(response => response.data)
  },

  /**
   * @param gatewayAccountId
   * @param allowGooglePay (boolean)
   * @returns {Promise<Object>}
   */
  toggleGooglePay: function (gatewayAccountId, allowGooglePay) {
    const url = ACCOUNT_API_PATH.replace('{accountId}', gatewayAccountId)
    const payload = {
      op: 'replace',
      path: 'allow_google_pay',
      value: allowGooglePay
    }
    return this.client._axios.patch(url, payload,
      { description: 'toggle allow google pay' })
      .then(response => response.data)
  },

  /**
   * @param gatewayAccountId
   * @param isMaskCardNumber (boolean)
   * @returns {Promise<Object>}
   */
  toggleMotoMaskCardNumberInput: function (gatewayAccountId, isMaskCardNumber) {
    const url = ACCOUNT_API_PATH.replace('{accountId}', gatewayAccountId)
    const payload = {
      op: 'replace',
      path: 'moto_mask_card_number_input',
      value: isMaskCardNumber
    }
    return this.client._axios.patch(url, payload,
      { description: 'Toggle gateway account card number masking setting' })
      .then(response => response.data)
  },

  /**
   * @param gatewayAccountId
   * @param isMaskSecurityCode (boolean)
   * @returns {Promise<Object>}
   */
  toggleMotoMaskSecurityCodeInput: function (gatewayAccountId, isMaskSecurityCode) {
    const url = ACCOUNT_API_PATH.replace('{accountId}', gatewayAccountId)
    const payload = {
      op: 'replace',
      path: 'moto_mask_card_security_code_input',
      value: isMaskSecurityCode
    }
    return this.client._axios.patch(url, payload,
      { description: 'Toggle gateway account card security code masking setting' })
      .then(response => response.data)
  },

  /**
   * @param gatewayAccountId
   * @param chargeId
   * @param payload
   * @returns {Promise<Object>}
   */
  postChargeRefund: function (gatewayAccountId, chargeId, payload) {
    const url = CHARGE_REFUNDS_API_PATH.replace('{accountId}', gatewayAccountId).replace('{chargeId}', chargeId)
    return this.client._axios.post(url, payload,
      { description: 'submit refund' })
      .then(response => response.data)
  },
  /**
   *
   * @param {Object} params
   */
  updateConfirmationEmail: function (params) {
    const url = _getNotificationEmailUrlFor(params.gatewayAccountId)

    return this.client._axios.patch(url, params.payload,
      { description: 'update confirmation email' })
      .then(response => response.data)
  },

  /**
   *
   * @param {Object} params
   */
  updateConfirmationEmailEnabled: function (params) {
    const url = _getNotificationEmailUrlFor(params.gatewayAccountId)

    return this.client._axios.patch(url, params.payload,
      { description: 'update confirmation email enabled' })
      .then(response => response.data)
  },

  /**
   *
   * @param {Object} params
   */
  updateEmailCollectionMode: function (params) {
    const url = _accountApiUrlFor(params.gatewayAccountId)

    return this.client._axios.patch(url, params.payload,
      { description: 'update email collection mode' })
      .then(response => response.data)
  },

  /**
   *
   * @param {Object} params
   */
  updateRefundEmailEnabled: function (params) {
    const url = _getNotificationEmailUrlFor(params.gatewayAccountId)

    return this.client._axios.patch(url, params.payload,
      { description: 'update refund email enabled' })
      .then(response => response.data)
  },

  /**
   * @param gatewayAccountId
   * @param integrationVersion3ds (number)
   * @returns {Promise<Object>}
   */
  updateIntegrationVersion3ds: function (gatewayAccountId, integrationVersion3ds) {
    const url = ACCOUNT_API_PATH.replace('{accountId}', gatewayAccountId)
    const payload = {
      op: 'replace',
      path: 'integration_version_3ds',
      value: integrationVersion3ds
    }
    return this.client._axios.patch(url, payload,
      { description: 'Set the 3DS integration version to use when authorising with the gateway' })
      .then(response => response.data)
  },

  getStripeAccountSetup: function (gatewayAccountId) {
    const url = STRIPE_ACCOUNT_SETUP_PATH.replace('{accountId}', gatewayAccountId)
    return this.client._axios.get(url, {
      description: 'get stripe account setup flags for gateway account'
    }).then(response => (new StripeAccountSetup(response.data)))
  },

  setStripeAccountSetupFlag: function (gatewayAccountId, stripeAccountSetupFlag) {
    const url = STRIPE_ACCOUNT_SETUP_PATH.replace('{accountId}', gatewayAccountId)
    const payload = [
      {
        op: 'replace',
        path: stripeAccountSetupFlag,
        value: true
      }
    ]
    return this.client._axios.patch(url, payload,
      { description: 'set stripe account setup flag to true for gateway account' })
      .then(response => response.data)
  },

  getStripeAccount: function (gatewayAccountId) {
    const url = STRIPE_ACCOUNT_PATH.replace('{accountId}', gatewayAccountId)
    return this.client._axios.get(url, {
      description: 'get stripe account for gateway account'
    }).then(response => (new StripeAccount(response.data)))
  },

  postChargeRequest: function (gatewayAccountId, payload) {
    const url = CHARGES_API_PATH.replace('{accountId}', gatewayAccountId)
    return this.client._axios.post(url, payload,
      { description: 'create payment' })
      .then(response => response.data)
  },

  getCharge: function (gatewayAccountId, chargeExternalId) {
    const url = CHARGE_API_PATH.replace('{accountId}', gatewayAccountId).replace('{chargeId}', chargeExternalId)
    return this.client._axios.get(url, { description: 'get a charge' })
      .then(response => response.data)
  },

  postAccountSwitchPSP: function (gatewayAccountId, payload) {
    const url = SWITCH_PSP_PATH.replace('{accountId}', gatewayAccountId)
    return this.client._axios.post(url, payload,
      { description: 'switch account payment service provider' })
      .then(response => response.data)
  }
}

module.exports.ConnectorClient = ConnectorClient
