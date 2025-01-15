'use strict'

const formatSimplifiedAccountPathsFor = require('../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const Connector = require('@services/clients/connector.client.js').ConnectorClient
const connectorClient = new Connector(process.env.CONNECTOR_URL)

class WorldpayTasks {
  /**
   * @param {GatewayAccount} gatewayAccount
   * @param {Service} service
   */
  constructor (gatewayAccount, serviceExternalId) {
    this.tasks = []
    this.incompleteTasks = true

    const credential = gatewayAccount.getCurrentCredential()

    if (gatewayAccount.allowMoto) {
      const worldpayCredentials = {
        href: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.oneOffCustomerInitiated,
          serviceExternalId, gatewayAccount.type),
        id: 'worldpay-credentials',
        linkText: 'Link your Worldpay account with GOV.UK Pay'

      }
      if (!credential || !credential.credentials.oneOffCustomerInitiated) {
        worldpayCredentials.complete = false
      } else {
        worldpayCredentials.complete = true
        worldpayCredentials.completedCard = {
          title: 'Account credentials',
          rows: [{
            keyText: 'Merchant code',
            valueText: credential.credentials?.oneOffCustomerInitiated?.merchantCode
          }, {
            keyText: 'Username',
            valueText: credential.credentials?.oneOffCustomerInitiated?.username
          }, {
            keyText: 'Password',
            valueText: '●●●●●●●●'
          }]
        }
      }
      this.tasks.push(worldpayCredentials)
    }

    this.incompleteTasks = this.tasks.filter(t => t.complete === false).length > 0
  }

  static async recalculate (serviceExternalId, accountType) {
    const gatewayAccount = await connectorClient.getAccountByServiceExternalIdAndAccountType({ serviceExternalId, accountType })
    return new WorldpayTasks(gatewayAccount, serviceExternalId)
  }
}

module.exports = { WorldpayTasks }
