const { ConnectorClient } = require('@services/clients/connector.client')
const GatewayAccount = require('@models/GatewayAccount.class')
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

async function getGatewayAccountsByIds (gatewayAccountIds) {
  const gatewayAccounts = await connectorClient.getAccounts({
    gatewayAccountIds
  })

  return gatewayAccounts.accounts.reduce((acc, gatewayAccount) => {
    const account = new GatewayAccount(gatewayAccount)
    acc[account.id] = account
    return acc
  }, {})
}

/**
 *
 * @param serviceExternalId
 * @param accountType
 * @returns {Promise<GatewayAccount>}
 */
async function getGatewayAccountByServiceExternalIdAndType (serviceExternalId, accountType) {
  return connectorClient.getAccountByServiceExternalIdAndAccountType({
    serviceExternalId,
    accountType
  })
}

module.exports = {
  getGatewayAccountsByIds,
  getGatewayAccountByServiceExternalIdAndType,
  postSwitchPSP: connectorClient.postSwitchPSPByServiceExternalIdAndAccountType.bind(connectorClient)
}
