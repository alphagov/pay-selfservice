const _ = require('lodash')
const {renderErrorView} = require('../utils/response.js')
const {isADirectDebitAccount} = require('../services/clients/direct_debit_connector_client')

function notAuthorised (req, res) {
  return renderErrorView(req, res, 'You do not have the rights to access this service.', 403)
}

/**
 * This middleware resolves the current service in context
 *
 */
module.exports = function (req, res, next) {
  const externalServiceId = req.params.externalServiceId
  const gatewayAccountId = _.get(req, 'gateway_account.currentGatewayAccountId')

  if (externalServiceId) {
    req.service = getServiceFromUserByExternalId(req, externalServiceId)
    if (!req.service) {
      return notAuthorised(req, res)
    }
  } else if (gatewayAccountId) {
    req.service = _.get(req.user.serviceRoles.find(serviceRole => serviceRole.service.gatewayAccountIds.includes(gatewayAccountId)), 'service')
  }

  if (!req.service && req.user.serviceRoles.length) {
    req.service = _.get(req.user.serviceRoles[0], 'service')
  }

  if (!req.service) {
    return notAuthorised(req, res)
  }

  delete req.params.externalServiceId

  req.service.hasDirectDebitGatewayAccount = gatewayAccountType(req) === 'has_direct_debit_gateway_account'
  req.service.hasCardGatewayAccount = gatewayAccountType(req) === 'has_card_gateway_account'
  req.service.hasCardAndDirectDebitGatewayAccount = gatewayAccountType(req) === 'has_card_and_dd_gateway_account'

  next()
}

function getServiceFromUserByExternalId (req, externalServiceId) {
  return _.get(req.user.serviceRoles.find(serviceRole => serviceRole.service.externalId === externalServiceId), 'service')
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
