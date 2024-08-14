'use strict'

const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')
const cardFixtures = require('../../fixtures/card.fixtures')
const worldpay3dsFlexCredentialsFixtures = require('../../fixtures/worldpay-3ds-flex-credentials.fixtures')
const worldpayCredentialsFixtures = require('../../fixtures/worldpay-credentials.fixtures')
const { stubBuilder } = require('./stub-builder')

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
        external_id: '42'
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
  return stubBuilder('GET', path, 200, { response: response })
}

function getCardTypesSuccess () {
  const path = '/v1/api/card-types'
  return stubBuilder('GET', path, 200, {
    response: cardFixtures.validCardTypesResponse()
  })
}

function postUpdateCardTypesSuccess (gatewayAccountId) {
  const path = `/v1/frontend/accounts/${gatewayAccountId}/card-types`
  return stubBuilder('POST', path, 200)
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

function patchAccountUpdateApplePaySuccess (gatewayAccountId, allowApplePay) {
  const path = `/v1/api/accounts/${gatewayAccountId}`
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

function patchUpdateServiceNameSuccess (gatewayAccountId, serviceName) {
  const path = `/v1/frontend/accounts/${gatewayAccountId}/servicename`
  return stubBuilder('PATCH', path, 200, {
    request: gatewayAccountFixtures.validPatchServiceNameRequest(serviceName)
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

function postCheckWorldpay3dsFlexCredentialsFailure (opts) {
  const path = `/v1/api/accounts/${opts.gatewayAccountId}/worldpay/check-3ds-flex-config`
  return stubBuilder('POST', path, 500, {
    request: worldpay3dsFlexCredentialsFixtures.checkValidWorldpay3dsFlexCredentialsRequest(opts).payload
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

function patchUpdateCredentialsSuccess (gatewayAccountId, credentialId) {
  const path = `/v1/api/accounts/${gatewayAccountId}/credentials/${credentialId}`
  return stubBuilder('PATCH', path, 200)
}

function patchUpdateWorldpayOneOffCredentialsSuccess (opts = {}) {
  const path = `/v1/api/accounts/${opts.gatewayAccountId}/credentials/${opts.credentialId}`
  return stubBuilder('PATCH', path, 200, {
    request: gatewayAccountFixtures.validUpdateGatewayAccountCredentialsRequest(opts)
  })
}

function postUpdateNotificationCredentialsSuccess (gatewayAccountId) {
  const path = `/v1/api/accounts/${gatewayAccountId}/notification-credentials`
  return stubBuilder('POST', path, 200)
}

function postSwitchPspSuccess (gatewayAccountId) {
  const path = `/v1/api/accounts/${gatewayAccountId}/switch-psp`
  return stubBuilder('POST', path, 200)
}

function getAccountByServiceIdAndAccountType (serviceExternalId, opts = {}) {
  const path = `/v1/api/service/${serviceExternalId}/account/test`
  return stubBuilder('GET', path, 200, {
    response: gatewayAccountFixtures.validGatewayAccountResponse(opts)
  })
}

function requestStripeTestAccount (serviceExternalId) {
  const path = `/v1/service/${serviceExternalId}/request-stripe-test-account`
  cy.log(`Setting up request stripe test account mock with ${path}`)
  return stubBuilder('POST', path, 200, {
    response: gatewayAccountFixtures.requestStripeTestAccountResponse()
  })
}

module.exports = {
  getAccountAuthSuccess,
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
  patchUpdateServiceNameSuccess,
  patchUpdateMaskCardNumberSuccess,
  patchUpdateMaskSecurityCodeSuccess,
  patchUpdate3dsVersionSuccess,
  postCheckWorldpay3dsFlexCredentials,
  postCheckWorldpay3dsFlexCredentialsFailure,
  postCheckWorldpay3dsFlexCredentialsWithBadResult,
  postCheckWorldpayCredentials,
  postUpdateWorldpay3dsFlexCredentials,
  patchUpdateCredentialsSuccess,
  patchUpdateWorldpayOneOffCredentialsSuccess,
  postUpdateNotificationCredentialsSuccess,
  postSwitchPspSuccess,
  patchAccountUpdateApplePaySuccess,
  patchAccountUpdateGooglePaySuccess,
  getAccountByServiceIdAndAccountType,
  requestStripeTestAccount
}
