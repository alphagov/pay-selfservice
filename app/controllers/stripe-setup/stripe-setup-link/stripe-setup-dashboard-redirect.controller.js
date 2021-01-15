'use strict'

const paths = require('../../../../app/paths')
const { ConnectorClient } = require('../../../services/clients/connector.client')
const { isADirectDebitAccount } = require('../../../services/clients/direct-debit-connector.client')
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)
const logger = require('../../../utils/logger')(__filename)
const { keys } = require('@govuk-pay/pay-js-commons').logging

function getTargetServiceForRedirect (user, externalServiceId) {
  return user.serviceRoles.filter((serviceRole) => serviceRole.service.externalId === externalServiceId)[0]
}

module.exports = async (req, res) => {
  const externalServiceId = req.params.externalServiceId
  const targetServiceRoleForRedirect = getTargetServiceForRedirect(req.user, externalServiceId)
  if (targetServiceRoleForRedirect) {
    const cardGatewayAccountIds = targetServiceRoleForRedirect.service.gatewayAccountIds.filter((id) => !isADirectDebitAccount(id))
    const result = await connectorClient.getAccounts({ gatewayAccountIds: cardGatewayAccountIds })
    const liveGatewayAccounts = result.accounts.filter((gatewayAccount) => gatewayAccount.type === 'live')
    if (liveGatewayAccounts && liveGatewayAccounts.length === 1) {
      req.gateway_account.currentGatewayAccountId = `${liveGatewayAccounts[0].gateway_account_id}`
      req.gateway_account.currentGatewayAccountExternalId = liveGatewayAccounts[0].external_id
    }
  } else {
    const logContext = {}
    logContext[keys.USER_EXTERNAL_ID] = req.user && req.user.externalId
    logContext[keys.SERVICE_EXTERNAL_ID] = externalServiceId
    logger.warn('User has no access to this service for dashboard redirect', logContext)
  }
  res.redirect(302, paths.dashboard.index)
}
