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

module.exports = {
  getGatewayAccountsByIds,
  postSwitchPSP: connectorClient.postSwitchPSPByServiceExternalIdAndAccountType.bind(connectorClient)
}
