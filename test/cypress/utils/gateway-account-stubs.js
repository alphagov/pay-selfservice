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

const getGatewayAccountSuccessRepeat = function (opts) {
  return {
    name: 'getGatewayAccountSuccessRepeat',
    opts: [{
      gateway_account_id: opts[0].gatewayAccountId,
      worldpay_3ds_flex: opts[0].worldpay3dsFlex,
      payment_provider: opts[0].paymentProvider,
      credentials: opts[0].credentials,
      repeat: 2
    },
    {
      gateway_account_id: opts[1].gatewayAccountId,
      payment_provider: opts[1].paymentProvider,
      worldpay_3ds_flex: opts[1].worldpay3dsFlex,
      credentials: opts[1].credentials
    }]
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

module.exports = {
  getGatewayAccountSuccess,
  getGatewayAccountSuccessRepeat,
  getGatewayAccountsSuccess,
  getAcceptedCardTypesSuccess,
  getDirectDebitGatewayAccountSuccess,
  postCreateGatewayAccountSuccess,
  getCardTypesSuccess,
  patchUpdate3DS
}
