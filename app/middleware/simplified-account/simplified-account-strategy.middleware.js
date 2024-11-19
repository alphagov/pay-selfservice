const { NotFoundError } = require('@root/errors')
const { SERVICE_EXTERNAL_ID, ACCOUNT_TYPE } = require('@root/paths').keys
const { keys } = require('@govuk-pay/pay-js-commons').logging
const { addField } = require('@services/clients/base/request-context')
const { getSwitchingCredentialIfExists } = require('@utils/credentials')
const _ = require('lodash')
const logger = require('@utils/logger')(__filename)
const Connector = require('@services/clients/connector.client.js').ConnectorClient
const connectorClient = new Connector(process.env.CONNECTOR_URL)

function getService (user, serviceExternalId, gatewayAccountId) {
  let service
  const serviceRoles = _.get(user, 'serviceRoles', [])

  if (serviceRoles.length > 0 && serviceExternalId) {
    service = _.get(serviceRoles.find(serviceRole => {
      return (serviceRole.service.externalId === serviceExternalId &&
        (!gatewayAccountId || serviceRole.service.gatewayAccountIds.includes(String(gatewayAccountId))))
    }), 'service')
  }

  return service
}

async function getGatewayAccount (serviceExternalId, accountType) {
  try {
    const params = {
      serviceExternalId,
      accountType
    }
    let gatewayAccount = await connectorClient.getAccountByServiceExternalIdAndAccountType(params)

    gatewayAccount = _.extend({}, gatewayAccount, {
      supports3ds: ['worldpay', 'stripe'].includes(gatewayAccount.paymentProvider),
      disableToggle3ds: gatewayAccount.paymentProvider === 'stripe'
    })

    const switchingCredential = getSwitchingCredentialIfExists(gatewayAccount)
    const isSwitchingToStripe = switchingCredential && switchingCredential.payment_provider === 'stripe'

    if (gatewayAccount.paymentProvider === 'stripe' || isSwitchingToStripe) {
      const stripeAccountSetup = await connectorClient.getStripeAccountSetupByServiceExternalIdAndAccountType(serviceExternalId, accountType)
      if (stripeAccountSetup) {
        gatewayAccount.connectorGatewayAccountStripeProgress = stripeAccountSetup
      }
    }

    return gatewayAccount
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
    const serviceExternalId = req.params[SERVICE_EXTERNAL_ID]
    const accountType = req.params[ACCOUNT_TYPE]

    if (!serviceExternalId || !accountType) {
      next(new NotFoundError('Could not resolve service external ID or gateway account type from request params'))
    }

    const gatewayAccount = await getGatewayAccount(serviceExternalId, accountType)
    if (gatewayAccount) {
      req.account = gatewayAccount
      addField(keys.GATEWAY_ACCOUNT_ID, gatewayAccount.id)
      addField(keys.GATEWAY_ACCOUNT_TYPE, gatewayAccount.type)
    } else {
      next(new NotFoundError('Could not retrieve gateway account with provided parameters'))
    }
    const service = getService(req.user, serviceExternalId, gatewayAccount.id)
    if (service) {
      req.service = service
      addField(keys.SERVICE_EXTERNAL_ID, service.externalId)
    } else {
      next(new NotFoundError('Could not find role for user on service'))
    }
    next()
  } catch (err) {
    next(err)
  }
}
