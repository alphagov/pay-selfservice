'use strict'

const _ = require('lodash')

const logger = require('../utils/logger')(__filename)
const paths = require('../../app/paths')
const { NotFoundError } = require('../../app/errors')
const Connector = require('../services/clients/connector.client.js').ConnectorClient

const { keys } = require('@govuk-pay/pay-js-commons').logging
const connectorClient = new Connector(process.env.CONNECTOR_URL)

async function getGatewayAccountByExternalId (gatewayAccountExternalId, correlationId) {
  try {
    const params = {
      gatewayAccountExternalId: gatewayAccountExternalId,
      correlationId: correlationId
    }
    let account = await connectorClient.getAccountByExternalId(params)

    account = _.extend({}, account, {
      supports3ds: ['worldpay', 'stripe', 'epdq', 'smartpay'].includes(account.payment_provider),
      disableToggle3ds: account.payment_provider === 'stripe'
    })

    if (account.payment_provider === 'stripe') {
      const stripeAccountSetup = await connectorClient.getStripeAccountSetup(account.gateway_account_id, correlationId)
      if (stripeAccountSetup) {
        account.connectorGatewayAccountStripeProgress = stripeAccountSetup
      }
    }

    return account
  } catch (err) {
    const logContext = {}
    logContext['error'] = err.message
    logContext['GATEWAY_ACCOUNT_EXTERNAL_ID'] = gatewayAccountExternalId
    logContext[keys.CORRELATION_ID] = correlationId

    if (err.errorCode === 404) {
      logger.info('Gateway account not found', logContext)
      throw new NotFoundError('Gateway account not found')
    } else {
      logger.error('Error when attempting to retrieve gateway account', logContext)
      throw new Error('Error retrieving Gateway account')
    }
  }
}

function getService (user, serviceExternalId, gatewayAccount, correlationId) {
  let service
  const serviceRoles = _.get(user, 'serviceRoles', [])

  if (serviceRoles.length > 0) {
    if (serviceExternalId) {
      service = _.get(serviceRoles.find(serviceRole => {
        return (serviceRole.service.externalId === serviceExternalId &&
          (!gatewayAccount || serviceRole.service.gatewayAccountIds.includes(gatewayAccount.gateway_account_id)))
      }), 'service')
    } else {
      if (gatewayAccount) {
        service = _.get(serviceRoles.find(serviceRole => {
          return serviceRole.service.gatewayAccountIds.includes(gatewayAccount.gateway_account_id)
        }), 'service')
      }
    }
  }

  if (service) {
    // hasCardGatewayAccount is needed to show relevant message (card or directdebit or both) on merchant details page.
    // Since it is only card currently supported, value is always 'true'
    service.hasCardGatewayAccount = true
    return service
  } else {
    const logContext = {}
    logContext[keys.USER_EXTERNAL_ID] = user.externalId
    logContext[keys.SERVICE_EXTERNAL_ID] = serviceExternalId
    if (gatewayAccount) {
      logContext[keys.GATEWAY_ACCOUNT_ID] = gatewayAccount.gateway_account_id
    }
    logContext[keys.CORRELATION_ID] = correlationId
    logger.info('Service not found for user', logContext)
    throw new NotFoundError('Service not found for user')
  }
}

module.exports = async function (req, res, next) {
  try {
    const correlationId = req.correlationId
    const serviceExternalId = req.params[paths.keys.SERVICE_EXTERNAL_ID]
    const gatewayAccountExternalId = req.params[paths.keys.GATEWAY_ACCOUNT_EXTERNAL_ID]

    if (!serviceExternalId && !gatewayAccountExternalId) {
      const logContext = {}
      logContext[keys.CORRELATION_ID] = correlationId
      logger.info('Could not resolve gateway account external ID or service external ID from request params')
      throw new Error('Could not resolve gateway account external ID or service external ID from request params')
    }

    let gatewayAccount
    if (gatewayAccountExternalId) {
      gatewayAccount = await getGatewayAccountByExternalId(gatewayAccountExternalId, correlationId)
      if (gatewayAccount) {
        req.account = gatewayAccount
        // TODO: To be removed once URLs are updated to use the format /service/:serviceExternalId/account/:gatewayAccountExternalId/xxx.
        // Currently authService.getCurrentGatewayAccountId() sets below if account is available on session or derives one from user services.
        req.gateway_account = { currentGatewayAccountId: gatewayAccount.gateway_account_id }
      }
    }

    // uses req.user object which is set by passport (auth.service.js) and has all user services information to find service by serviceExternalId or gatewayAccountId.
    // A separate API call to adminusers to find service makes it independent of user object but most of tests setup currently relies on req.user
    req.service = getService(req.user, serviceExternalId, gatewayAccount, correlationId)

    next()
  } catch (err) {
    next(err)
  }
}
