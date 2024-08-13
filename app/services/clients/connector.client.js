'use strict'

const logger = require('../../utils/logger')(__filename)
const { Client } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/axios-base-client')
const { configureClient } = require('./base/config')
const StripeAccountSetup = require('../../models/StripeAccountSetup.class')
const StripeAccount = require('../../models/StripeAccount.class')

// Constants
const SERVICE_NAME = 'connector'

const responseBodyToStripeAccountSetupTransformer = body => new StripeAccountSetup(body)
const responseBodyToStripeAccountTransformer = body => new StripeAccount(body)

const client = new Client(SERVICE_NAME)

/**
 * Connects to connector
 * @param {string} connectorUrl connector url
 */
function ConnectorClient (connectorUrl) {
  this.connectorUrl = connectorUrl
}

ConnectorClient.prototype = {
  getAccountByServiceIdAndAccountType: async function (params) {
    const url = `${this.connectorUrl}/v1/api/service/{serviceId}/account/{accountType}`
      .replace('{serviceId}', encodeURIComponent(params.serviceId))
      .replace('{accountId}', encodeURIComponent(params.accountType))
    configureClient(client, url)
    const response = await client.get(url, 'get gateway account by service Id and account type')
    return response.data
  },

  /**
   * Retrieves the given gateway account
   * @param params
   *          An object with the following elements;
   *            gatewayAccountId (required)
   *@return {Promise}
   */
  getAccount: async function (params) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}`
      .replace('{accountId}', encodeURIComponent(params.gatewayAccountId))
    configureClient(client, url)
    const response = await client.get(url, 'get an account')
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
    const url = `${this.connectorUrl}/v1/frontend/accounts/external-id/{externalId}`
      .replace('{externalId}', encodeURIComponent(params.gatewayAccountExternalId))
    configureClient(client, url)
    const response = await client.get(url, 'get an account')
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
    const url = `${this.connectorUrl}/v1/api/accounts?accountIds=` + params.gatewayAccountIds.join(',')
    configureClient(client, url)
    const response = await client.get(url, 'get an account')
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

    const url = `${this.connectorUrl}/v1/api/accounts`
    configureClient(client, url)
    const response = await client.post(url, payload, 'create a gateway account')
    return response.data
  },

  patchAccountGatewayAccountCredentials: async function (params) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}/credentials/{credentialsId}`
      .replace('{accountId}', encodeURIComponent(params.gatewayAccountId))
      .replace('{credentialsId}', encodeURIComponent(params.gatewayAccountCredentialsId))

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

    configureClient(client, url)
    const response = await client.patch(url, payload, 'patch gateway account credentials')
    return response.data
  },

  patchGooglePayGatewayMerchantId: async function (gatewayAccountId, gatewayAccountCredentialsId, googlePayGatewayMerchantId, userExternalId) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}/credentials/{credentialsId}`
      .replace('{accountId}', encodeURIComponent(gatewayAccountId))
      .replace('{credentialsId}', encodeURIComponent(gatewayAccountCredentialsId))

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

    configureClient(client, url)
    const response = await client.patch(url, payload, 'patch gateway account credentials for google pay merchant id')
    return response.data
  },

  patchAccountGatewayAccountCredentialsState: async function (params) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}/credentials/{credentialsId}`
      .replace('{accountId}', encodeURIComponent(params.gatewayAccountId))
      .replace('{credentialsId}', encodeURIComponent(params.gatewayAccountCredentialsId))

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

    configureClient(client, url)
    const response = await client.patch(url, payload, 'patch gateway account credentials state')
    return response.data
  },

  /**
   *
   * @param {Object} params
   * @returns {ConnectorClient}
   */
  postAccountNotificationCredentials: async function (params) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}/notification-credentials`
      .replace('{accountId}', encodeURIComponent(params.gatewayAccountId))
    logger.debug('Calling connector to update notification credentials', {
      service: 'connector',
      method: 'POST',
      url: url
    })
    configureClient(client, url)
    const response = await client.post(url, params.payload, 'patch gateway account credentials')
    return response.data
  },

  /**
   * Checks Worldpay 3DS Flex credentials
   *
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  postCheckWorldpay3dsFlexCredentials: async function (params) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}/worldpay/check-3ds-flex-config`
      .replace('{accountId}', encodeURIComponent(params.gatewayAccountId))
    configureClient(client, url)
    const response = await client.post(url, params.payload, 'Check Worldpay 3DS Flex credentials')
    return response.data
  },

  postCheckWorldpayCredentials: async function (params) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}/worldpay/check-credentials`
      .replace('{accountId}', encodeURIComponent(params.gatewayAccountId))
    configureClient(client, url)
    const response = await client.post(url, params.payload, 'Check Worldpay credentials')
    return response.data
  },

  /**
   *
   * @param {Object} params
   * @returns {Promise}
   */
  post3dsFlexAccountCredentials: async function (params) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}/3ds-flex-credentials`
      .replace('{accountId}', encodeURIComponent(params.gatewayAccountId))
    configureClient(client, url)
    const response = await client.post(url, params.payload, 'Update 3DS Flex credentials')
    return response.data
  },

  /**
   *
   * @param {Object} params
   * @returns {Promise}
   */
  postCancelAgreement: async function (params) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}/agreements/{agreementId}/cancel`
      .replace('{accountId}', encodeURIComponent(params.gatewayAccountId))
      .replace('{agreementId}', encodeURIComponent(params.agreementId))
    configureClient(client, url)
    const response = await client.post(url, params.payload, 'Cancel agreement')
    return response.data
  },

  /**
   * Retrieves the accepted card Types for the given account
   * @param gatewayAccountId (required)
   * @returns {Promise<Object>}
   */
  getAcceptedCardsForAccountPromise: async function (gatewayAccountId) {
    const url = `${this.connectorUrl}/v1/frontend/accounts/{accountId}/card-types`
      .replace('{accountId}', encodeURIComponent(gatewayAccountId))
    configureClient(client, url)
    const response = await client.get(url, 'get accepted card types for account')
    return response.data
  },

  /**
   * Updates the accepted card Types for to the given gateway account
   * @param gatewayAccountId (required)
   * @param payload (required)
   * @returns {Promise<Object>}
   */
  postAcceptedCardsForAccount: async function (gatewayAccountId, payload) {
    const url = `${this.connectorUrl}/v1/frontend/accounts/{accountId}/card-types`
      .replace('{accountId}', encodeURIComponent(gatewayAccountId))
    configureClient(client, url)
    const response = await client.post(url, payload, 'post accepted card types for account')
    return response.data
  },

  /**
   * Retrieves all card types
   * @returns {Promise<Object>}
   */
  getAllCardTypes: async function () {
    const url = `${this.connectorUrl}/v1/api/card-types`
    logger.debug('Calling connector to get all card types', {
      service: 'connector',
      method: 'GET',
      url: url
    })
    configureClient(client, url)
    const response = await client.get(url, 'Retrieves all card types')
    return response.data
  },

  /**
   * @param gatewayAccountId
   * @param serviceName
   * @returns {Promise<Object>}
   */
  patchServiceName: async function (gatewayAccountId, serviceName) {
    const url = `${this.connectorUrl}/v1/frontend/accounts/{accountId}/servicename`
      .replace('{accountId}', encodeURIComponent(gatewayAccountId))
    configureClient(client, url)
    const response = await client.patch(url, { service_name: serviceName }, 'update service name')
    return response.data
  },

  /**
   * @param gatewayAccountId
   * @param allowApplePay (boolean)
   * @returns {Promise<Object>}
   */
  toggleApplePay: async function (gatewayAccountId, allowApplePay) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}`
      .replace('{accountId}', encodeURIComponent(gatewayAccountId))
    const body = {
      op: 'replace',
      path: 'allow_apple_pay',
      value: allowApplePay
    }
    configureClient(client, url)
    const response = await client.patch(url, body, 'toggle allow apple pay')
    return response.data
  },

  /**
   * @param gatewayAccountId
   * @param allowGooglePay (boolean)
   * @returns {Promise<Object>}
   */
  toggleGooglePay: async function (gatewayAccountId, allowGooglePay) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}`
      .replace('{accountId}', encodeURIComponent(gatewayAccountId))
    const body = {
      op: 'replace',
      path: 'allow_google_pay',
      value: allowGooglePay
    }
    configureClient(client, url)
    const response = await client.patch(url, body, 'toggle allow google pay')
    return response.data
  },

  /**
   * @param gatewayAccountId
   * @param isMaskCardNumber (boolean)
   * @returns {Promise<Object>}
   */
  toggleMotoMaskCardNumberInput: async function (gatewayAccountId, isMaskCardNumber) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}`
      .replace('{accountId}', encodeURIComponent(gatewayAccountId))
    const body = {
      op: 'replace',
      path: 'moto_mask_card_number_input',
      value: isMaskCardNumber
    }
    configureClient(client, url)
    const response = await client.patch(url, body, 'Toggle gateway account card number masking setting')
    return response.data
  },

  /**
   * @param gatewayAccountId
   * @param isMaskSecurityCode (boolean)
   * @returns {Promise<Object>}
   */
  toggleMotoMaskSecurityCodeInput: async function (gatewayAccountId, isMaskSecurityCode) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}`
      .replace('{accountId}', encodeURIComponent(gatewayAccountId))
    const body = {
      op: 'replace',
      path: 'moto_mask_card_security_code_input',
      value: isMaskSecurityCode
    }
    configureClient(client, url)
    const response = await client.patch(url, body, 'Toggle gateway account card security code masking setting')
    return response.data
  },

  /**
   * @param gatewayAccountId
   * @param chargeId
   * @param payload
   * @returns {Promise<Object>}
   */
  postChargeRefund: async function (gatewayAccountId, chargeId, payload) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}/charges/{chargeId}/refunds`
      .replace('{accountId}', encodeURIComponent(gatewayAccountId))
      .replace('{chargeId}', encodeURIComponent(chargeId))
    configureClient(client, url)
    const response = await client.post(url, payload, 'submit refund')
    return response.data
  },
  /**
   *
   * @param {Object} params
   */
  updateConfirmationEmail: async function (params) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}/email-notification`
      .replace('{accountId}', encodeURIComponent(params.gatewayAccountId))
    configureClient(client, url)
    const response = await client.patch(url, params.payload, 'update confirmation email')
    return response.data
  },

  /**
   *
   * @param {Object} params
   */
  updateConfirmationEmailEnabled: async function (params) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}/email-notification`
      .replace('{accountId}', encodeURIComponent(params.gatewayAccountId))
    configureClient(client, url)
    const response = await client.patch(url, params.payload, 'update confirmation email enabled')
    return response.data
  },

  /**
   *
   * @param {Object} params
   */
  updateEmailCollectionMode: async function (params) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}`
      .replace('{accountId}', encodeURIComponent(params.gatewayAccountId))
    configureClient(client, url)
    const response = await client.patch(url, params.payload, 'update email collection mode')
    return response.data
  },

  /**
   *
   * @param {Object} params
   */
  updateRefundEmailEnabled: async function (params) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}/email-notification`
      .replace('{accountId}', encodeURIComponent(params.gatewayAccountId))
    configureClient(client, url)
    const response = await client.patch(url, params.payload, 'update refund email enabled')
    return response.data
  },

  /**
   * @param gatewayAccountId
   * @param integrationVersion3ds (number)
   * @returns {Promise<Object>}
   */
  updateIntegrationVersion3ds: async function (gatewayAccountId, integrationVersion3ds) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}`
      .replace('{accountId}', encodeURIComponent(gatewayAccountId))
    const body = {
      op: 'replace',
      path: 'integration_version_3ds',
      value: integrationVersion3ds
    }
    configureClient(client, url)
    const response = await client.patch(url, body, 'Set the 3DS integration version to use when authorising with the gateway')
    return response.data
  },

  getStripeAccountSetup: async function (gatewayAccountId) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}/stripe-setup`
      .replace('{accountId}', encodeURIComponent(gatewayAccountId))
    configureClient(client, url)
    const response = await client.get(url, 'get stripe account setup flags for gateway account')
    return responseBodyToStripeAccountSetupTransformer(response.data)
  },

  setStripeAccountSetupFlag: async function (gatewayAccountId, stripeAccountSetupFlag) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}/stripe-setup`
      .replace('{accountId}', encodeURIComponent(gatewayAccountId))
    const body = [
      {
        op: 'replace',
        path: stripeAccountSetupFlag,
        value: true
      }
    ]
    configureClient(client, url)
    const response = await client.patch(url, body, 'set stripe account setup flag to true for gateway account')
    return response.data
  },

  getStripeAccount: async function (gatewayAccountId) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}/stripe-account`
      .replace('{accountId}', encodeURIComponent(gatewayAccountId))
    configureClient(client, url)
    const response = await client.get(url, 'get stripe account for gateway account')
    return responseBodyToStripeAccountTransformer(response.data)
  },

  requestStripeTestAccount: async function (serviceId) {
    const url = `${this.connectorUrl}/v1/service/${encodeURIComponent(serviceId)}/request-stripe-test-account`
    configureClient(client, url)
    const response = await client.post(url)
    return response.data
  },

  postChargeRequest: async function (gatewayAccountId, payload) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}/charges`
      .replace('{accountId}', encodeURIComponent(gatewayAccountId))
    configureClient(client, url)
    const response = await client.post(url, payload, 'create payment')
    return response.data
  },

  getCharge: async function (gatewayAccountId, chargeExternalId) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}/charges/{chargeId}`
      .replace('{accountId}', encodeURIComponent(gatewayAccountId))
      .replace('{chargeId}', encodeURIComponent(chargeExternalId))
    configureClient(client, url)
    const response = await client.get(url, 'get a charge')
    return response.data
  },

  postAccountSwitchPSP: async function (gatewayAccountId, payload) {
    const url = `${this.connectorUrl}/v1/api/accounts/{accountId}/switch-psp`
      .replace('{accountId}', encodeURIComponent(gatewayAccountId))
    configureClient(client, url)
    const response = await client.post(url, payload, 'switch account payment service provider')
    return response.data
  }
}

module.exports.ConnectorClient = ConnectorClient
