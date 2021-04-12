'use strict'

const paths = require('../../../../app/paths')
const formatAccountPathsFor = require('../../../utils/format-account-paths-for')
const { ConnectorClient } = require('../../../services/clients/connector.client')
const { isADirectDebitAccount } = require('../../../services/clients/direct-debit-connector.client')
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)
const logger = require('../../../utils/logger')(__filename)

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
      const gatewayAccountExternalId = liveGatewayAccounts[0].external_id
      return res.redirect(302, formatAccountPathsFor(paths.account.dashboard.index, gatewayAccountExternalId))
    }
  }

  logger.warn('User has no access to this service for dashboard redirect')
  res.redirect(302, paths.index)
}
