const { ConnectorClient } = require('@services/clients/connector.client')
const getAdminUsersClient = require('@services/clients/adminusers.client')
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)
const adminUsersClient = getAdminUsersClient()

module.exports = {
  updateApplePay: connectorClient.updateAllowApplePay.bind(connectorClient),
  updateGooglePay: connectorClient.updateAllowGooglePay.bind(connectorClient),
  updateCollectBillingAddress: adminUsersClient.updateCollectBillingAddress,
  updateDefaultBillingAddressCountry: adminUsersClient.updateDefaultBillingAddressCountry
}
