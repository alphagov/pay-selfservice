'use strict'

const _ = require('lodash')

const logger = require('../utils/logger')(__filename)
const { SERVICE_EXTERNAL_ID, GATEWAY_ACCOUNT_EXTERNAL_ID } = require('../paths').keys
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
    logContext['error_code'] = err.errorCode
    logContext['GATEWAY_ACCOUNT_EXTERNAL_ID'] = gatewayAccountExternalId
    logContext[keys.CORRELATION_ID] = correlationId

    if (err.errorCode === 404) {
      logger.info('Gateway account not found', logContext)
    } else {
      logger.error('Error retrieving gateway account', logContext)
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
          (!gatewayAccount || serviceRole.service.gatewayAccountIds.includes(String(gatewayAccount.gateway_account_id))))
      }), 'service')
    } else {
      if (gatewayAccount) {
        service = _.get(serviceRoles.find(serviceRole => {
          return serviceRole.service.gatewayAccountIds.includes(String(gatewayAccount.gateway_account_id))
        }), 'service')
      }
    }
  }

  if (service) {
    // hasCardGatewayAccount is needed to show relevant message (card or directdebit or both) on merchant details page.
    // Since it is only card currently supported, value is always 'true'
    service.hasCardGatewayAccount = true
    return service
  }
}

module.exports = async function getServiceAndGatewayAccount (req, res, next) {
  try {
    if (req.user) {
      const correlationId = req.correlationId
      const serviceExternalId = req.params[SERVICE_EXTERNAL_ID]
      const gatewayAccountExternalId = req.params[GATEWAY_ACCOUNT_EXTERNAL_ID]

      if (!serviceExternalId && !gatewayAccountExternalId) {
        throw new Error('Could not resolve gateway account external ID or service external ID from request params')
      }

      let gatewayAccount
      if (gatewayAccountExternalId) {
        gatewayAccount = await getGatewayAccountByExternalId(gatewayAccountExternalId, correlationId)
        if (gatewayAccount) {
          req.account = gatewayAccount
          // TODO: To be removed once URLs are updated to use the format /service/:serviceExternalId/account/:gatewayAccountExternalId/xxx.
          // Currently authService.getCurrentGatewayAccountId() sets below if account is available on session or derives one from user services.
          req.gateway_account = {
            currentGatewayAccountId: gatewayAccount.gateway_account_id && String(gatewayAccount.gateway_account_id),
            currentGatewayAccountExternalId: gatewayAccount.external_id
          }
        }
      }

      // uses req.user object which is set by passport (auth.service.js) and has all user services information to find service by serviceExternalId or gatewayAccountId.
      // A separate API call to adminusers to find service makes it independent of user object but most of tests setup currently relies on req.user
      req.service = getService(req.user, serviceExternalId, gatewayAccount, correlationId)
    }

    next()
  } catch (err) {
    next(err)
  }
}
