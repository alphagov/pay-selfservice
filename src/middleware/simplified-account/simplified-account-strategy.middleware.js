const { NotFoundError } = require('@root/errors')
const { SERVICE_EXTERNAL_ID, ACCOUNT_TYPE } = require('@root/paths').keys
const { keys } = require('@govuk-pay/pay-js-commons').logging
const { addField } = require('@services/clients/base/request-context')
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
    return await connectorClient.getAccountByServiceExternalIdAndAccountType(params)
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
      return next(new NotFoundError('Could not resolve service external ID or gateway account type from request params'))
    }

    const gatewayAccount = await getGatewayAccount(serviceExternalId, accountType)
    if (gatewayAccount) {
      req.account = gatewayAccount
      addField(keys.GATEWAY_ACCOUNT_ID, gatewayAccount.id)
      addField(keys.GATEWAY_ACCOUNT_TYPE, gatewayAccount.type)
    } else {
      return next(new NotFoundError('Could not retrieve gateway account with provided parameters'))
    }
    const service = getService(req.user, serviceExternalId, gatewayAccount.id)
    if (service) {
      req.service = service
      addField(keys.SERVICE_EXTERNAL_ID, service.externalId)
    } else {
      return next(new NotFoundError('Could not find role for user on service'))
    }
    next()
  } catch (err) {
    next(err)
  }
}

/**
 * An Express Request object extended with service, account, and user
 * @typedef {Object} SimplifiedAccountRequest // TODO rename this when simplified accounts are live
 * @property {GOVUKPayService} service
 * @property {GatewayAccount} account
 * @property {User} user
 * @property {SimplifiedAccountRequestParams} params // TODO rename this when simplified accounts are live
 * @property {Object} body
 */

/**
 *
 * URL Params for Request object
 @typedef {Object} SimplifiedAccountRequestParams // TODO rename this when simplified accounts are live
 @property {String} serviceExternalId
 @property {String} accountType
 @property {String} [webhookExternalId]
 */
