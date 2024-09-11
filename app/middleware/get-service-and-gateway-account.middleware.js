'use strict'

const _ = require('lodash')

const logger = require('../utils/logger')(__filename)
const { SERVICE_EXTERNAL_ID, GATEWAY_ACCOUNT_EXTERNAL_ID, ENVIRONMENT_ID } = require('../paths').keys
const Connector = require('../services/clients/connector.client.js').ConnectorClient

const { keys } = require('@govuk-pay/pay-js-commons').logging
const { addField } = require('../services/clients/base/request-context')
const { getSwitchingCredentialIfExists } = require('../utils/credentials')
const connectorClient = new Connector(process.env.CONNECTOR_URL)

async function getGatewayAccountByExternalId (gatewayAccountExternalId) {
  try {
    const params = {
      gatewayAccountExternalId: gatewayAccountExternalId
    }
    let account = await connectorClient.getAccountByExternalId(params)

    account = _.extend({}, account, {
      supports3ds: ['worldpay', 'stripe', 'epdq', 'smartpay'].includes(account.payment_provider),
      disableToggle3ds: account.payment_provider === 'stripe'
    })

    const switchingCredential = getSwitchingCredentialIfExists(account)
    const isSwitchingToStripe = switchingCredential && switchingCredential.payment_provider === 'stripe'
    if (account.payment_provider === 'stripe' || isSwitchingToStripe) {
      const stripeAccountSetup = await connectorClient.getStripeAccountSetup(account.gateway_account_id)
      if (stripeAccountSetup) {
        account.connectorGatewayAccountStripeProgress = stripeAccountSetup
      }
    }

    return account
  } catch (err) {
    const logContext = {
      error: err.message,
      error_code: err.errorCode
    }

    if (err.errorCode === 404) {
      logger.info('Gateway account not found', logContext)
    } else {
      logger.error('Error retrieving gateway account', logContext)
    }
  }
}

function getService (user, serviceExternalId, gatewayAccount) {
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

  return service
}

module.exports = async function getServiceAndGatewayAccount (req, res, next) {
  try {
    if (req.user) {
      const serviceExternalId = req.params[SERVICE_EXTERNAL_ID]
      const gatewayAccountExternalId = req.params[GATEWAY_ACCOUNT_EXTERNAL_ID]
      const environment = req.params[ENVIRONMENT_ID]

      if (!serviceExternalId && !gatewayAccountExternalId) {
        throw new Error('Could not resolve gateway account external ID or service external ID from request params')
      }

      let gatewayAccount
      if (gatewayAccountExternalId) {
        gatewayAccount = await getGatewayAccountByExternalId(gatewayAccountExternalId)
        if (gatewayAccount) {
          req.account = gatewayAccount
          addField(keys.GATEWAY_ACCOUNT_ID, gatewayAccount.gateway_account_id)
          addField(keys.GATEWAY_ACCOUNT_TYPE, gatewayAccount.type)

          // Used to "upgrade" old account URLs that don't contain the account external ID to visit
          // the URL for the last visited account. Can be removed when we no longer support that.
          req.gateway_account = {
            currentGatewayAccountExternalId: gatewayAccount.external_id
          }
        }
      }

      // uses req.user object which is set by passport (auth.service.js) and has all user services information to find service by serviceExternalId or gatewayAccountId.
      // A separate API call to adminusers to find service makes it independent of user object but most of tests setup currently relies on req.user
      const service = getService(req.user, serviceExternalId, gatewayAccount)
      if (service) {
        req.service = service
        addField(keys.SERVICE_EXTERNAL_ID, service.externalId)
      }

      if (environment) {
        req.isLive = environment === 'live'
      }
    }

    next()
  } catch (err) {
    next(err)
  }
}
