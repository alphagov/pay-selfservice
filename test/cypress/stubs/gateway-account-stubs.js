'use strict'

const getGatewayAccountSuccess = function (opts) {
  let stubOptions = { gateway_account_id: opts.gatewayAccountId }

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

  return {
    name: 'getGatewayAccountSuccess',
    opts: stubOptions
  }
}

const getGatewayAccountsSuccess = function (opts) {
  return {
    name: 'getGatewayAccountsSuccess',
    opts: {
      gateway_account_id: opts.gatewayAccountId,
      type: opts.type,
      payment_provider: opts.paymentProvider
    }
  }
}

const getAccountAuthSuccess = function (opts) {
  return {
    name: 'getAccountAuthSuccess',
    opts: {
      gateway_account_id: opts.gatewayAccountId
    }
  }
}

const getDirectDebitGatewayAccountSuccess = function (opts) {
  return {
    name: 'getDirectDebitGatewayAccountSuccess',
    opts: {
      gateway_account_id: opts.gatewayAccountId,
      type: opts.type,
      payment_provider: opts.paymentProvider,
      is_connected: opts.isConnected
    }
  }
}

const postCreateGatewayAccountSuccess = function (opts) {
  return {
    name: 'postCreateGatewayAccountSuccess',
    opts: {
      service_name: opts.serviceName,
      payment_provider: opts.paymentProvider,
      type: opts.type,
      gateway_account_id: opts.gatewayAccountId,
      verifyCalledTimes: opts.verifyCalledTimes
    }
  }
}

const getAcceptedCardTypesSuccess = function (opts) {
  return {
    name: 'getAcceptedCardTypesSuccess',
    opts: {
      account_id: opts.gatewayAccountId,
      updated: opts.updated,
      maestro: opts.maestro || ''
    }
  }
}

const getCardTypesSuccess = function () {
  return {
    name: 'getCardTypesSuccess'
  }
}

const patchUpdate3DS = function (opts) {
  return {
    name: 'patchUpdate3DS',
    opts: {
      toggle_3ds: opts.toggle3ds
    }
  }
}

const patchConfirmationEmailToggleSuccess = function (opts) {
  return {
    name: 'patchConfirmationEmailToggleSuccess',
    opts:
      {
        gateway_account_id: opts.gatewayAccountId,
        enabled: true
      }
  }
}
const patchRefundEmailToggleSuccess = function (opts) {
  return {
    name: 'patchRefundEmailToggleSuccess',
    opts: {
      gateway_account_id: opts.gatewayAccountId,
      enabled: true
    }
  }
}

const patchAccountEmailCollectionModeSuccess = function (opts) {
  return {
    name: 'patchAccountEmailCollectionModeSuccess',
    opts: {
      gateway_account_id: opts.gatewayAccountId,
      collectionMode: 'MANDATORY'
    }
  }
}

const patchUpdateCredentials = function (opts) {
  return {
    name: 'patchUpdateCredentials',
    opts: {
      gateway_account_id: opts.gatewayAccountId,
      merchant_id: opts.merchant_id,
      username: opts.username,
      password: opts.password
    }
  }
}

const patchUpdateFlexCredentials = function (opts) {
  return {
    name: 'patchUpdateFlexCredentials',
    opts: {
      gateway_account_id: opts.gatewayAccountId,
      organisational_unit_id: opts.organisational_unit_id,
      issuer: opts.issuer,
      jwt_mac_key: opts.jwt_mac_key
    }
  }
}

module.exports = {
  getAccountAuthSuccess,
  getGatewayAccountSuccess,
  getGatewayAccountsSuccess,
  getAcceptedCardTypesSuccess,
  getDirectDebitGatewayAccountSuccess,
  postCreateGatewayAccountSuccess,
  getCardTypesSuccess,
  patchUpdate3DS,
  patchConfirmationEmailToggleSuccess,
  patchRefundEmailToggleSuccess,
  patchAccountEmailCollectionModeSuccess,
  patchUpdateCredentials,
  patchUpdateFlexCredentials
}
