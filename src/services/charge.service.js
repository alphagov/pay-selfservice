const { ConnectorClient } = require('@services/clients/connector.client')
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = {
  createCharge: connectorClient.postChargeRequestByServiceExternalIdAndAccountType.bind(connectorClient),
  getCharge: connectorClient.getChargeByServiceExternalIdAndAccountType.bind(connectorClient)
}
