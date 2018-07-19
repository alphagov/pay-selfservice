const _ = require('lodash')
const {renderErrorView} = require('../utils/response.js')
const {isADirectDebitAccount} = require('../services/clients/direct_debit_connector_client')
/**
 * This middleware resolves the current service in context
 *
 */
module.exports = function (req, res, next) {
  const externalServiceId = req.params.externalServiceId
  const gatewayAccountId = _.get(req, 'gateway_account.currentGatewayAccountId')
  if (externalServiceId) {
    req.service = _.get(req.user.serviceRoles.find(serviceRole => serviceRole.service.externalId === externalServiceId), 'service')
  } else if (gatewayAccountId) {
    req.service = _.get(req.user.serviceRoles.find(serviceRole => serviceRole.service.gatewayAccountIds.includes(gatewayAccountId)), 'service')
  }
  if (!req.service) {
    return renderErrorView(req, res, 'You do not have the rights to access this service.')
  }

  req.service.hasDirectDebitGatewayAccount = gatewayAccountType(req) === 'has_direct_debit_gateway_account'
  req.service.hasCardGatewayAccount = gatewayAccountType(req) === 'has_card_gateway_account'
  req.service.hasCardAndDirectDebitGatewayAccount = gatewayAccountType(req) === 'has_card_and_dd_gateway_account'

  next()
}

function gatewayAccountType (req) {
  let hasDDAccount = false
  let hasCardAccount = false

  if (req.service.gatewayAccountIds) {
    req.service.gatewayAccountIds.forEach((element) => {
      if (isADirectDebitAccount(element)) {
        hasDDAccount = true
      } else {
        hasCardAccount = true
      }
    })
  }
  if (hasDDAccount && hasCardAccount) {
    return 'has_card_and_dd_gateway_account'
  } else if (hasDDAccount) {
    return 'has_direct_debit_gateway_account'
  } else if (hasCardAccount) {
    return 'has_card_gateway_account'
  }
}
