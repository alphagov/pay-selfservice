'use strict'

// NPM modules
const _ = require('lodash')

// Local modules
const { renderErrorView } = require('../utils/response.js')
const { isADirectDebitAccount } = require('../services/clients/direct-debit-connector.client')

const notAuthorised = (req, res) => {
  return renderErrorView(req, res, 'You do not have the rights to access this service.', 403)
}

const getServiceFromUserByExternalId = (req, externalServiceId) => {
  return _.get(req.user.serviceRoles.find(serviceRole => serviceRole.service.externalId === externalServiceId), 'service')
}

const gatewayAccountType = req => {
  if (req.service.gatewayAccountIds) {
    const DDorNot = req.service.gatewayAccountIds.map(account => isADirectDebitAccount(account))

    if (DDorNot.every(account => account === true)) {
      return 'hasDirectDebitGatewayAccount'
    } else if (DDorNot.some(account => account === true)) {
      return 'hasCardAndDirectDebitGatewayAccount'
    } else {
      return 'hasCardGatewayAccount'
    }
  }
}

// @TMP(sfount) - attach a service to the "request" "session" given either a service in the params
// OR a gateway account ID already set in the cookie session

// This middleware resolves the current service in context
module.exports = (req, res, next) => {
  const { externalServiceId } = req.params
  const gatewayAccountId = _.get(req, 'gateway_account.currentGatewayAccountId')

  if (externalServiceId) {
    req.service = getServiceFromUserByExternalId(req, externalServiceId)
    if (!req.service) {
      return notAuthorised(req, res)
    }
  } else if (gatewayAccountId) {
    req.service = _.get(req.user.serviceRoles.find(serviceRole => serviceRole.service.gatewayAccountIds.includes(gatewayAccountId)), 'service')
  }

  // @TMP(sfount) why, when, what, who?
  if (!req.service && req.user.serviceRoles.length > 0) {
    req.service = _.get(req.user.serviceRoles[0], 'service')
  }

  if (!req.service) {
    return notAuthorised(req, res)
  }

  // @TMP(sfount) this gives me yikes
  delete req.params.externalServiceId

  req.service.hasDirectDebitGatewayAccount = gatewayAccountType(req) === 'hasDirectDebitGatewayAccount'
  req.service.hasCardGatewayAccount = gatewayAccountType(req) === 'hasCardGatewayAccount'
  req.service.hasCardAndDirectDebitGatewayAccount = gatewayAccountType(req) === 'hasCardAndDirectDebitGatewayAccount'

  next()
}
