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

module.exports = {
  getGatewayAccountSuccess,
  getGatewayAccountsSuccess,
  getDirectDebitGatewayAccountSuccess
}
