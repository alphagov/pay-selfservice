const { ConnectorClient } = require('@services/clients/connector.client')
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = {
  postSwitchPSP: connectorClient.postSwitchPSPByServiceExternalIdAndAccountType.bind(connectorClient)
}
