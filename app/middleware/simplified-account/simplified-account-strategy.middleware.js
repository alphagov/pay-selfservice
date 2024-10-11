'use strict'
const _ = require('lodash')
const { keys } = require('@govuk-pay/pay-js-commons').logging
const { addField } = require('../../services/clients/base/request-context')
const Connector = require('../../services/clients/connector.client.js').ConnectorClient
const { getSwitchingCredentialIfExists } = require('../../utils/credentials')
const { SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, ENVIRONMENT_ID } = require('../../paths').keys
const logger = require('../../utils/logger')(__filename)
const connectorClient = new Connector(process.env.CONNECTOR_URL)

function getService (user, serviceExternalId, gatewayAccountId) {
  let service
  const serviceRoles = _.get(user, 'serviceRoles', [])

  if (serviceRoles.length > 0) {
    if (serviceExternalId) {
      service = _.get(serviceRoles.find(serviceRole => {
        return (serviceRole.service.externalId === serviceExternalId &&
          (!gatewayAccountId || serviceRole.service.gatewayAccountIds.includes(String(gatewayAccountId))))
      }), 'service')
    }
  }

  return service
}

async function getGatewayAccountByServiceIdAndAccountType (serviceExternalId, accountType) {
  try {
    const params = {
      serviceId: serviceExternalId,
      accountType
    }
    let account = await connectorClient.getAccountByServiceIdAndAccountType(params)

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

module.exports = async function getSimplifiedAccount (req, res, next) {
  try {
    if (req.user) {
      const serviceExternalId = req.params[SERVICE_EXTERNAL_ID]
      const accountType = req.params[ACCOUNT_TYPE]

      if (!serviceExternalId || !accountType) {
        throw new Error('Could not resolve service external ID or gateway account type from request params')
      }

      let gatewayAccount = await getGatewayAccountByServiceIdAndAccountType(serviceExternalId, accountType)
      if (gatewayAccount) {
        req.account = gatewayAccount
        addField(keys.GATEWAY_ACCOUNT_ID, gatewayAccount.gateway_account_id)
        addField(keys.GATEWAY_ACCOUNT_TYPE, gatewayAccount.type)
        req.gateway_account = {
          currentGatewayAccountExternalId: gatewayAccount.external_id
        }
      }
      const service = getService(req.user, serviceExternalId, gatewayAccount.gateway_account_id)
      if (service) {
        req.service = service
        addField(keys.SERVICE_EXTERNAL_ID, service.externalId)
      }
    }

    next()
  } catch (err) {
    next(err)
  }
}
