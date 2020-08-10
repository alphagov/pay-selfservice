'use strict'

const getGatewayAccountSuccess = function (opts) {
  return {
    name: 'getGatewayAccountSuccess',
    opts: { gateway_account_id: opts.gatewayAccountId }
  }
}

module.exports = { getGatewayAccountSuccess }
