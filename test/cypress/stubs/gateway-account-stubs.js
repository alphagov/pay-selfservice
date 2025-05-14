'use strict'

const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')
const cardFixtures = require('../../fixtures/card.fixtures')
const worldpay3dsFlexCredentialsFixtures = require('../../fixtures/worldpay-3ds-flex-credentials.fixtures')
const worldpayCredentialsFixtures = require('../../fixtures/worldpay-credentials.fixtures')
const { stubBuilder } = require('./stub-builder')
const { validServiceResponse } = require('@test/fixtures/service.fixtures')

function parseGatewayAccountOptions (opts) {
  const stubOptions = { gateway_account_id: opts.gatewayAccountId }

  if (opts.paymentProvider) {
    stubOptions.payment_provider = opts.paymentProvider
  }
  if (opts.allowGooglePay !== undefined) {
    stubOptions.allow_google_pay = opts.allowGooglePay
  }
  if (opts.allowApplePay !== undefined) {
    stubOptions.allow_apple_pay = opts.allowApplePay
  }
  if (opts.requires3ds) {
    stubOptions.requires3ds = opts.requires3ds
  }
  if (opts.integrationVersion3ds !== undefined) {
    stubOptions.integrationVersion3ds = opts.integrationVersion3ds
  }
  if (opts.allowMoto) {
    stubOptions.allow_moto = opts.allowMoto
  }
  if (opts.type) {
    stubOptions.type = opts.type
  }
  if (opts.worldpay3dsFlex) {
    stubOptions.worldpay_3ds_flex = opts.worldpay3dsFlex
  }
  if (opts.credentials) {
    stubOptions.credentials = opts.credentials
  }

  if (opts.allowMoto) {
    stubOptions.allow_moto = opts.allowMoto
  }

  if (opts.motoMaskCardNumber) {
    stubOptions.moto_mask_card_number_input = opts.motoMaskCardNumber
  }

  if (opts.motoMaskSecurityCode) {
    stubOptions.moto_mask_card_security_code_input = opts.motoMaskSecurityCode
  }

  if (opts.notificationCredentials) {
    stubOptions.notificationCredentials = opts.notificationCredentials
  }

  if (opts.gatewayAccountExternalId) {
    stubOptions.external_id = opts.gatewayAccountExternalId
  }

  if (opts.serviceExternalId) {
    stubOptions.service_id = opts.serviceExternalId
  }

  if (opts.providerSwitchEnabled !== undefined) {
    stubOptions.provider_switch_enabled = opts.providerSwitchEnabled
  }

  if (opts.gatewayAccountCredentials) {
    stubOptions.gateway_account_credentials = opts.gatewayAccountCredentials
  }

  if (opts.recurringEnabled) {
    stubOptions.recurring_enabled = opts.recurringEnabled
  }

  if (opts.disabled) {
    stubOptions.disabled = opts.disabled
  }

  return stubOptions
}

function getGatewayAccountSuccess (opts) {
  const path = `/v1/api/accounts/${opts.gatewayAccountId}`
  const fixtureOpts = parseGatewayAccountOptions(opts)
  return stubBuilder('GET', path, 200, {
    response: gatewayAccountFixtures.validGatewayAccountResponse(fixtureOpts)
  })
}

function getGatewayAccountByExternalIdSuccess (opts) {
  const fixtureOpts = parseGatewayAccountOptions(opts)
  const path = `/v1/frontend/accounts/external-id/${opts.gatewayAccountExternalId}`
  return stubBuilder('GET', path, 200, {
    response: gatewayAccountFixtures.validGatewayAccountResponse(fixtureOpts)
  })
}

function getGatewayAccountsSuccess (opts) {
  const path = '/v1/api/accounts'
  return stubBuilder('GET', path, 200, {
    query: {
      accountIds: opts.gatewayAccountId.toString()
    },
    response: gatewayAccountFixtures.validGatewayAccountsResponse({
      accounts: [{
        gateway_account_id: opts.gatewayAccountId,
        type: opts.type,
        payment_provider: opts.paymentProvider,
        external_id: opts.gatewayAccountExternalId || '42'
      }]
    })
  })
}

function getGatewayAccountsSuccessForMultipleAccounts (accountsOpts) {
  const path = '/v1/api/accounts'
  return stubBuilder('GET', path, 200, {
    query: {
      accountIds: accountsOpts.map(account => account.gatewayAccountId).join(',')
    },
    response: gatewayAccountFixtures.validGatewayAccountsResponse({
      accounts: accountsOpts.map(parseGatewayAccountOptions)
    })
  })
}

function getAccountAuthSuccess (opts) {
  const path = `/v1/frontend/auth/${opts.gatewayAccountId}`
  return stubBuilder('GET', path, 200, {
    response: gatewayAccountFixtures.validGatewayAccountTokensResponse({
      gateway_account_id: opts.gatewayAccountId
    })
  })
}

function postCreateGatewayAccountSuccess (opts) {
  const fixtureOpts = {
    service_name: opts.serviceName,
    service_id: opts.serviceId,
    payment_provider: opts.paymentProvider,
    type: opts.type,
    gateway_account_id: opts.gatewayAccountId
  }

  const path = '/v1/api/accounts'
  return stubBuilder('POST', path, 200, {
    request: gatewayAccountFixtures.validCreateGatewayAccountRequest(fixtureOpts),
    response: gatewayAccountFixtures.validGatewayAccountResponse(fixtureOpts)
  })
}

function getAcceptedCardTypesSuccess (opts) {
  const path = `/v1/frontend/accounts/${opts.gatewayAccountId}/card-types`
  const response = cardFixtures.validAcceptedCardTypesResponse({
    account_id: opts.gatewayAccountId,
    updated: opts.updated,
    maestro: opts.maestro || ''
  })
  return stubBuilder('GET', path, 200, { response })
}

function getAcceptedCardTypesByServiceExternalIdAndAccountType (opts) {
  const path = `/v1/frontend/service/${opts.serviceExternalId}/account/${opts.accountType}/card-types`
  const response = cardFixtures.validAcceptedCardTypesResponse({
    account_id: opts.gatewayAccountId,
    updated: opts.updated,
    maestro: opts.maestro || '',
    toggleAmex: opts.toggleAmex || false
  })
  return stubBuilder('GET', path, 200, { response })
}

function postAcceptedCardTypesByServiceExternalIdAndAccountType (opts) {
  const path = `/v1/frontend/service/${opts.serviceExternalId}/account/${opts.accountType}/card-types`
  return stubBuilder('POST', path, 200, {
    deepMatchRequest: false
  })
}

function getCardTypesSuccess () {
  const path = '/v1/api/card-types'
  return stubBuilder('GET', path, 200, {
    response: cardFixtures.validCardTypesResponse()
  })
}

function postUpdateCardTypesSuccess (gatewayAccountId) {
  const path = `/v1/frontend/accounts/${gatewayAccountId}/card-types`
  return stubBuilder('POST', path, 200, {
    deepMatchRequest: false
  })
}

function patchConfirmationEmailToggleSuccess (opts) {
  const path = `/v1/api/accounts/${opts.gatewayAccountId}/email-notification`
  return stubBuilder('PATCH', path, 200, {
    request: gatewayAccountFixtures.validGatewayAccountEmailConfirmationToggleRequest(true)
  })
}

function patchRefundEmailToggleSuccess (opts) {
  const path = `/v1/api/accounts/${opts.gatewayAccountId}/email-notification`
  return stubBuilder('PATCH', path, 200, {
    request: gatewayAccountFixtures.validGatewayAccountEmailRefundToggleRequest(true)
  })
}

function patchAccountEmailCollectionModeSuccess (opts) {
  const path = `/v1/api/accounts/${opts.gatewayAccountId}`
  return stubBuilder('PATCH', path, 200, {
    request: gatewayAccountFixtures.validGatewayAccountEmailCollectionModeRequest('MANDATORY')
  })
}

function patchAccountEmailCollectionModeSuccessByServiceIdAndAccountType (serviceId, accountType, emailCollectionMode = 'MANDATORY') {
  const path = `/v1/api/service/${serviceId}/account/${accountType}`
  return stubBuilder('PATCH', path, 200,
    { request: { op: 'replace', path: 'email_collection_mode', value: emailCollectionMode } })
}

function setRefundEmailEnabledByServiceIdAndAccountType (serviceId, accountType, enabled) {
  const path = `/v1/api/service/${serviceId}/account/${accountType}/email-notification`
  const payload = {
    request: {
      op: 'replace',
      path: '/refund_issued/enabled',
      value: enabled
    }
  }
  return stubBuilder('PATCH', path, 200, payload)
}

function patchCustomParagraphByServiceIdAndAccountType (serviceId, accountType, text) {
  const path = `/v1/api/service/${serviceId}/account/${accountType}/email-notification`
  const payload = {
    request: {
      op: 'replace',
      path: '/payment_confirmed/template_body',
      value: text
    }
  }
  return stubBuilder('PATCH', path, 200, payload)
}

function setPaymentConfirmationEmailEnabledByServiceIdAndAccountType (serviceId, accountType, enabled) {
  const path = `/v1/api/service/${serviceId}/account/${accountType}/email-notification`
  const payload = {
    request: {
      op: 'replace',
      path: '/payment_confirmed/enabled',
      value: enabled
    }
  }
  return stubBuilder('PATCH', path, 200, payload)
}

function patchAccountUpdateApplePaySuccess (gatewayAccountId, allowApplePay) {
  const path = `/v1/api/accounts/${gatewayAccountId}`
  return stubBuilder('PATCH', path, 200, {
    request: gatewayAccountFixtures.validUpdateToggleApplePayRequest(allowApplePay)
  })
}

function patchAccountByServiceExternalIdAndAccountTypeUpdateApplePaySuccess (serviceExternalId, accountType, allowApplePay) {
  const path = `/v1/api/service/${serviceExternalId}/account/${accountType}`
  return stubBuilder('PATCH', path, 200, {
    request: gatewayAccountFixtures.validUpdateToggleApplePayRequest(allowApplePay)
  })
}

function patchAccountUpdateGooglePaySuccess (gatewayAccountId, allowGooglePay) {
  const path = `/v1/api/accounts/${gatewayAccountId}`
  return stubBuilder('PATCH', path, 200, {
    request: gatewayAccountFixtures.validUpdateToggleGooglePayRequest(allowGooglePay)
  })
}

function patchAccountByServiceExternalIdAndAccountTypeUpdateGooglePaySuccess (serviceExternalId, accountType, allowApplePay) {
  const path = `/v1/api/service/${serviceExternalId}/account/${accountType}`
  return stubBuilder('PATCH', path, 200, {
    request: gatewayAccountFixtures.validUpdateToggleGooglePayRequest(allowApplePay)
  })
}

function patchAccountByServiceExternalIdAndAccountTypeUpdateGooglePayMerchantIdSuccess (serviceExternalId, accountType, credentialExternalId, opts) {
  const path = `/v1/api/service/${serviceExternalId}/account/${accountType}/credentials/${credentialExternalId}`
  return stubBuilder('PATCH', path, 200, {
    request: gatewayAccountFixtures.validPatchWorldpayGooglePayMerchantIdRequest(opts)
  })
}

function patchUpdateServiceNameSuccess (gatewayAccountId, serviceName) {
  const path = `/v1/frontend/accounts/${gatewayAccountId}/servicename`
  return stubBuilder('PATCH', path, 200, {
    request: gatewayAccountFixtures.validPatchServiceNameRequest(serviceName),
    deepMatchRequest: true
  })
}

function patchUpdateMaskCardNumberSuccess (gatewayAccountId, mask) {
  const path = `/v1/api/accounts/${gatewayAccountId}`
  return stubBuilder('PATCH', path, 200, {
    request: gatewayAccountFixtures.validPatchMaskCardNumberRequest(mask)
  })
}

function patchUpdateMaskSecurityCodeSuccess (gatewayAccountId, mask) {
  const path = `/v1/api/accounts/${gatewayAccountId}`
  return stubBuilder('PATCH', path, 200, {
    request: gatewayAccountFixtures.validPatchMaskSecurityCodeRequest(mask)
  })
}

function patchAccountByServiceExternalIdAndAccountTypeUpdateMaskCardNumberSuccess (serviceExternalId, accountType, mask) {
  const path = `/v1/api/service/${serviceExternalId}/account/${accountType}`
  return stubBuilder('PATCH', path, 200, {
    request: gatewayAccountFixtures.validPatchMaskCardNumberRequest(mask)
  })
}

function patchAccountByServiceExternalIdAndAccountTypeUpdateMaskCardSecurityCodeSuccess (serviceExternalId, accountType, mask) {
  const path = `/v1/api/service/${serviceExternalId}/account/${accountType}`
  return stubBuilder('PATCH', path, 200, {
    request: gatewayAccountFixtures.validPatchMaskSecurityCodeRequest(mask)
  })
}

function patchUpdate3dsVersionSuccess (gatewayAccountId, version) {
  const path = `/v1/api/accounts/${gatewayAccountId}`
  return stubBuilder('PATCH', path, 200, {
    request: gatewayAccountFixtures.validPatchIntegrationVersion3dsRequest(version)
  })
}

function postCheckWorldpay3dsFlexCredentials (opts) {
  const path = `/v1/api/accounts/${opts.gatewayAccountId}/worldpay/check-3ds-flex-config`
  return stubBuilder('POST', path, 200, {
    request: worldpay3dsFlexCredentialsFixtures.checkValidWorldpay3dsFlexCredentialsRequest(opts).payload,
    response: worldpay3dsFlexCredentialsFixtures.checkValidWorldpay3dsFlexCredentialsResponse(opts)
  })
}

function postCheckWorldpayCredentials (opts) {
  const path = `/v1/api/accounts/${opts.gatewayAccountId}/worldpay/check-credentials`
  return stubBuilder('POST', path, 200, {
    request: worldpayCredentialsFixtures.checkValidWorldpayCredentialsRequest(opts).payload,
    response: worldpayCredentialsFixtures.checkValidWorldpayCredentialsResponse(opts)
  })
}

function postCheckWorldpayCredentialsByServiceExternalIdAndType (serviceExternalId, accountType, payload) {
  const path = `/v1/api/service/${serviceExternalId}/account/${accountType}/worldpay/check-credentials`
  return stubBuilder('POST', path, 200, {
    request: payload,
    response: {
      result: 'valid'
    }
  })
}

function postCheckWorldpay3dsFlexByServiceExternalIdAndType (serviceExternalId, accountType, payload, result = 'valid') {
  const path = `/v1/api/service/${serviceExternalId}/account/${accountType}/worldpay/check-3ds-flex-config`
  return stubBuilder('POST', path, 200, {
    request: payload,
    response: {
      result
    }
  })
}

function postCheckWorldpay3dsFlexCredentialsWithBadResult (opts) {
  const path = `/v1/api/accounts/${opts.gatewayAccountId}/worldpay/check-3ds-flex-config`
  return stubBuilder('POST', path, 200, {
    request: worldpay3dsFlexCredentialsFixtures.checkValidWorldpay3dsFlexCredentialsRequest(opts).payload,
    response: worldpay3dsFlexCredentialsFixtures.checkValidWorldpay3dsFlexCredentialsResponse({
      result: 'bad data'
    })
  })
}

function postUpdateWorldpay3dsFlexCredentials (opts) {
  const path = `/v1/api/accounts/${opts.gatewayAccountId}/3ds-flex-credentials`
  return stubBuilder('POST', path, 200, {
    request: worldpay3dsFlexCredentialsFixtures.validUpdateWorldpay3dsCredentialsRequest(opts)
  })
}

/**
 *
 * @param {String} serviceExternalId
 * @param {String} accountType
 * @param payload
 * @returns {{predicates: ({deepEquals: {path, method}}|{equals: {path, method}})[], name: string, responses: {is: {headers: (*|{'Content-Type': string}), statusCode}}[]}}
 */
function putWorldpay3dsFlexByServiceExternalIdAndType (serviceExternalId, accountType, payload) {
  const path = `/v1/api/service/${serviceExternalId}/account/${accountType}/3ds-flex-credentials`
  return stubBuilder('PUT', path, 200, {
    request: payload
  })
}

/**
 *
 * @param {String} serviceExternalId
 * @param {String} accountType
 * @param {integer} version
 * @returns {{predicates: ({deepEquals: {path, method}}|{equals: {path, method}})[], name: string, responses: {is: {headers: (*|{'Content-Type': string}), statusCode}}[]}}
 */
function patchUpdate3dsVersionByServiceExternalIdAndAccountType (serviceExternalId, accountType, version = 2) {
  const path = `/v1/api/service/${serviceExternalId}/account/${accountType}`
  return stubBuilder('PATCH', path, 200, {
    request: {
      op: 'replace',
      path: 'integration_version_3ds',
      value: version
    }
  })
}

/**
 *
 * @param {Number | String} gatewayAccountId
 * @param {Number | String} credentialId
 * @param {String} updatedByUserExternalId
 * @param {{ path: String, value: String }} patchOpts
 * @returns {{predicates: [{deepEquals: {path, method}}|{equals: {path, method}}], name: string, responses: [{is: {headers, statusCode: *}}]}}
 */
function patchUpdateCredentialsSuccess (gatewayAccountId, credentialId, updatedByUserExternalId, patchOpts) {
  const path = `/v1/api/accounts/${gatewayAccountId}/credentials/${credentialId}`
  return stubBuilder('PATCH', path, 200, {
    request: [{
      op: 'replace',
      path: patchOpts.path,
      value: patchOpts.value
    }, {
      op: 'replace',
      path: 'last_updated_by_user_external_id',
      value: updatedByUserExternalId
    }]
  })
}

function patchUpdateCredentialsSuccessByServiceExternalIdAndType (serviceExternalId, accountType, credentialId, patchOpts) {
  const path = `/v1/api/service/${serviceExternalId}/account/${accountType}/credentials/${credentialId}`
  return stubBuilder('PATCH', path, 200, {
    request: [{
      op: 'replace',
      path: patchOpts.path,
      value: patchOpts.value
    }, {
      op: 'replace',
      path: 'last_updated_by_user_external_id',
      value: patchOpts.userExternalId
    }]
  })
}

function patchUpdateWorldpayOneOffCredentialsSuccess (opts = {}) {
  const path = `/v1/api/accounts/${opts.gatewayAccountId}/credentials/${opts.credentialId}`
  return stubBuilder('PATCH', path, 200, {
    request: gatewayAccountFixtures.validUpdateGatewayAccountCredentialsRequest(opts)
  })
}

function postSwitchPspSuccess (gatewayAccountId, opts) {
  const path = `/v1/api/accounts/${gatewayAccountId}/switch-psp`
  return stubBuilder('POST', path, 200, {
    request: {
      user_external_id: opts.userExternalId,
      gateway_account_credential_external_id: opts.credentialExternalId
    }
  })
}

function postSwitchPspSuccessByServiceExternalIdAndAccountType (opts) {
  const path = `/v1/api/service/${opts.serviceExternalId}/account/${opts.accountType}/switch-psp`
  return stubBuilder('POST', path, 200, {
    request: {
      user_external_id: opts.userExternalId,
      gateway_account_credential_external_id: opts.credentialExternalId
    }
  })
}

function getAccountByServiceIdAndAccountType (serviceExternalId, accountType = 'test', opts = {}) {
  const path = `/v1/api/service/${serviceExternalId}/account/${accountType}`
  return stubBuilder('GET', path, 200, {
    response: gatewayAccountFixtures.validGatewayAccountResponse(opts)
  })
}

function getStripeAccountByServiceIdAndAccountType (serviceExternalId, accountType = 'test', opts) {
  const path = `/v1/api/service/${serviceExternalId}/account/${accountType}/stripe-account`
  return stubBuilder('GET', path, 200, {
    response: {
      stripe_account_id: opts.stripeAccountId
    }
  })
}

function requestStripeTestAccount (serviceExternalId, opts = {}) {
  const path = `/v1/api/service/${serviceExternalId}/request-stripe-test-account`
  return stubBuilder('POST', path, 200, {
    response: gatewayAccountFixtures.requestStripeTestAccountResponse(opts)
  })
}

function addGatewayAccountsToService (serviceExternalId, opts = {}) {
  const path = `/v1/api/services/${serviceExternalId}`
  return stubBuilder('PATCH', path, 200, {
    response: validServiceResponse(opts)
  })
}

module.exports = {
  addGatewayAccountsToService,
  getAccountAuthSuccess,
  getAccountByServiceIdAndAccountType,
  getStripeAccountByServiceIdAndAccountType,
  getGatewayAccountSuccess,
  getGatewayAccountsSuccess,
  getGatewayAccountByExternalIdSuccess,
  getGatewayAccountsSuccessForMultipleAccounts,
  getAcceptedCardTypesSuccess,
  postCreateGatewayAccountSuccess,
  getCardTypesSuccess,
  postUpdateCardTypesSuccess,
  patchConfirmationEmailToggleSuccess,
  patchRefundEmailToggleSuccess,
  patchAccountEmailCollectionModeSuccess,
  patchAccountEmailCollectionModeSuccessByServiceIdAndAccountType,
  patchCustomParagraphByServiceIdAndAccountType,
  patchUpdateServiceNameSuccess,
  patchUpdateMaskCardNumberSuccess,
  patchUpdateMaskSecurityCodeSuccess,
  patchUpdate3dsVersionSuccess,
  postCheckWorldpay3dsFlexCredentials,
  postCheckWorldpay3dsFlexCredentialsWithBadResult,
  postCheckWorldpay3dsFlexByServiceExternalIdAndType,
  postCheckWorldpayCredentials,
  postCheckWorldpayCredentialsByServiceExternalIdAndType,
  postUpdateWorldpay3dsFlexCredentials,
  putWorldpay3dsFlexByServiceExternalIdAndType,
  patchUpdate3dsVersionByServiceExternalIdAndAccountType,
  patchUpdateCredentialsSuccess,
  patchUpdateCredentialsSuccessByServiceExternalIdAndType,
  patchUpdateWorldpayOneOffCredentialsSuccess,
  postSwitchPspSuccess,
  postSwitchPspSuccessByServiceExternalIdAndAccountType,
  patchAccountUpdateApplePaySuccess,
  patchAccountByServiceExternalIdAndAccountTypeUpdateApplePaySuccess,
  patchAccountUpdateGooglePaySuccess,
  patchAccountByServiceExternalIdAndAccountTypeUpdateGooglePaySuccess,
  patchAccountByServiceExternalIdAndAccountTypeUpdateGooglePayMerchantIdSuccess,
  patchAccountByServiceExternalIdAndAccountTypeUpdateMaskCardNumberSuccess,
  patchAccountByServiceExternalIdAndAccountTypeUpdateMaskCardSecurityCodeSuccess,
  requestStripeTestAccount,
  setPaymentConfirmationEmailEnabledByServiceIdAndAccountType,
  setRefundEmailEnabledByServiceIdAndAccountType,
  getAcceptedCardTypesByServiceExternalIdAndAccountType,
  postAcceptedCardTypesByServiceExternalIdAndAccountType
}
