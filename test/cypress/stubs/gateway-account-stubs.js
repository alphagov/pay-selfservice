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

  if (opts.providerSwitchEnabled !== undefined) {
    stubOptions.provider_switch_enabled = opts.providerSwitchEnabled
  }

  if (opts.gatewayAccountCredentials) {
    stubOptions.gateway_account_credentials = opts.gatewayAccountCredentials
  }

  return stubOptions
}

function getGatewayAccountSuccess (opts) {
  const path = `/v1/frontend/accounts/${opts.gatewayAccountId}`
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
  const path = '/v1/frontend/accounts'
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
  const path = '/v1/frontend/accounts'
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

function getDirectDebitGatewayAccountSuccess (opts) {
  const path = `/v1/api/accounts/${opts.gatewayAccountId}`
  return stubBuilder('GET', path, 200, {
    response: gatewayAccountFixtures.validDirectDebitGatewayAccountResponse({
      gateway_account_id: opts.gatewayAccountId,
      type: opts.type,
      payment_provider: opts.paymentProvider,
      is_connected: opts.isConnected
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
    response: gatewayAccountFixtures.validGatewayAccountResponse(fixtureOpts),
    verifyCalledTimes: opts.verifyCalledTimes
  })
}

function getAcceptedCardTypesSuccess (opts) {
  const path = `/v1/frontend/accounts/${opts.gatewayAccountId}/card-types`
  const response = opts.updated
    ? cardFixtures.validUpdatedAcceptedCardTypesResponse()
    : cardFixtures.validAcceptedCardTypesResponse({
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

function postCheckWorldpay3dsFlexCredentials (opts) {
  const path = `/v1/api/accounts/${opts.gatewayAccountId}/worldpay/check-3ds-flex-config`
  if (opts.shouldReturnValid) {
    return stubBuilder('POST', path, 200, {
      request: worldpay3dsFlexCredentialsFixtures.checkValidWorldpay3dsFlexCredentialsRequest().payload,
      response: worldpay3dsFlexCredentialsFixtures.checkValidWorldpay3dsFlexCredentialsResponse()
    })
  } else {
    return stubBuilder('POST', path, 200, {
      request: worldpay3dsFlexCredentialsFixtures.checkInvalidWorldpay3dsFlexCredentialsRequest().payload,
      response: worldpay3dsFlexCredentialsFixtures.checkInvalidWorldpay3dsFlexCredentialsResponse()
    })
  }
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

module.exports = {
  getAccountAuthSuccess,
  getGatewayAccountSuccess,
  getGatewayAccountsSuccess,
  getGatewayAccountByExternalIdSuccess,
  getGatewayAccountsSuccessForMultipleAccounts,
  getAcceptedCardTypesSuccess,
  getDirectDebitGatewayAccountSuccess,
  postCreateGatewayAccountSuccess,
  getCardTypesSuccess,
  patchConfirmationEmailToggleSuccess,
  patchRefundEmailToggleSuccess,
  patchAccountEmailCollectionModeSuccess,
  postCheckWorldpay3dsFlexCredentials,
  postCheckWorldpay3dsFlexCredentialsFailure,
  postCheckWorldpay3dsFlexCredentialsWithBadResult,
  postCheckWorldpayCredentials
}
